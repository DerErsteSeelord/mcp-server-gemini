import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { 
  GenerateRequest, 
  GenerateResponse, 
  MCPRequest, 
  MCPResponse,
  StreamRequest,
  StreamResponse,
  CancelRequest,
  ConfigureRequest
} from './types/protocols.js';
import { ERROR_CODES } from './protocol.js';
import EventEmitter from 'events';

/**
 * Handles MCP protocol requests for the Gemini API.
 * 
 * @since 1.0.0
 * @modified 1.1.0 - Added support for model customization
 */
export class MCPHandlers extends EventEmitter {
  private activeRequests: Map<string | number, AbortController>;
  private defaultModel: string;

  /**
   * Creates a new MCP handler instance for Gemini.
   * 
   * @param {GenerativeModel} model - Default Gemini model instance
   * @param {any} protocol - Protocol manager instance
   * @param {GoogleGenerativeAI} genAI - Google Generative AI client instance
   * @param {string} defaultModel - Default model name to use when not specified
   * @param {boolean} debug - Whether to enable debug logging
   * 
   * @since 1.0.0
   * @modified 1.1.0 - Added genAI and defaultModel parameters
   */
  constructor(
    private model: GenerativeModel, 
    private protocol: any,
    private genAI?: GoogleGenerativeAI,
    defaultModel: string = 'gemini-pro',
    private debug: boolean = false
  ) {
    super();
    this.activeRequests = new Map();
    this.defaultModel = defaultModel;
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log('[MCP Debug]', ...args);
    }
  }
  
  /**
   * Gets a Gemini model instance with the specified model name.
   * If no model name is provided or it matches the default, returns the default model.
   * Otherwise, creates a new model instance with the specified name.
   * 
   * @param {string} modelName - Name of the Gemini model to use
   * @returns {GenerativeModel} The Generative model instance
   * 
   * @since 1.1.0
   */
  private getModel(modelName?: string): GenerativeModel {
    // If no model name provided or it matches default, use default model
    if (!modelName || modelName === this.defaultModel) {
      return this.model;
    }
    
    // If no genAI instance provided, can't create new models
    if (!this.genAI) {
      this.log(`Cannot create model ${modelName}, falling back to default`);
      return this.model;
    }
    
    // Create and return new model instance
    this.log(`Creating new model instance for ${modelName}`);
    return this.genAI.getGenerativeModel({ model: modelName });
  }

  private validateRequest(request: any, requiredParams: string[] = []): boolean {
    if (!request || typeof request !== 'object') {
      return false;
    }
    
    if (request.jsonrpc !== '2.0' || !request.method || !request.id) {
      return false;
    }
    
    if (requiredParams.length > 0 && (!request.params || typeof request.params !== 'object')) {
      return false;
    }
    
    for (const param of requiredParams) {
      if (request.params[param] === undefined) {
        return false;
      }
    }
    
    return true;
  }
    async handleInitialize(request: MCPRequest): Promise<MCPResponse> {
    this.log('Initializing with params:', request.params);
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: this.protocol.createInitializeResult()
    };
  }
  async handleGenerate(request: GenerateRequest): Promise<GenerateResponse> {
    this.log('Handling generate request:', request.params);
    
    if (!this.validateRequest(request, ['prompt'])) {
      throw this.createError(ERROR_CODES.INVALID_PARAMS, 'Invalid or missing parameters');
    }

    // Get model - use requested model or fall back to default
    const modelName = request.params.model || this.defaultModel;
    const modelToUse = this.getModel(modelName);
    this.log(`Using model: ${modelName}`);

    const abortController = new AbortController();
    this.activeRequests.set(request.id, abortController);    
    
    try {
      const result = await modelToUse.generateContent({
        contents: [{ role: 'user', parts: [{ text: request.params.prompt }] }],
        generationConfig: {
          temperature: request.params.temperature,
          maxOutputTokens: request.params.maxTokens,
          stopSequences: request.params.stopSequences,
        }
      });
      const response = await result.response;

      this.activeRequests.delete(request.id);      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          type: 'completion',
          content: response.text(),
          metadata: {
            model: modelName,
            provider: 'google',
            temperature: request.params.temperature,
            maxTokens: request.params.maxTokens,
            stopSequences: request.params.stopSequences,
          }
        }
      };
    } catch (error) {
      this.log('Generation error:', error);
      this.activeRequests.delete(request.id);
      throw error;
    }
  }  async handleStream(request: StreamRequest): Promise<void> {
    this.log('Handling stream request:', request.params);
    
    if (!this.validateRequest(request, ['prompt'])) {
      throw this.createError(ERROR_CODES.INVALID_PARAMS, 'Invalid or missing parameters');
    }

    // Get model - use requested model or fall back to default
    const modelName = request.params.model || this.defaultModel;
    const modelToUse = this.getModel(modelName);
    this.log(`Using model for streaming: ${modelName}`);

    const abortController = new AbortController();
    this.activeRequests.set(request.id, abortController);
    
    try {
      const stream = await modelToUse.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: request.params.prompt }] }],
        generationConfig: {
          temperature: request.params.temperature,
          maxOutputTokens: request.params.maxTokens,
          stopSequences: request.params.stopSequences,
        }
      });
      
      const chunks = await stream.response;
      let contentText = '';
      
      // Process text content
      if (chunks && chunks.candidates && chunks.candidates.length > 0) {
        const candidate = chunks.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          contentText = candidate.content.parts[0].text || '';
        }
      }
        // Send chunk
      const streamResponse: StreamResponse = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          type: 'stream',
          content: contentText,
          done: true,
          metadata: {
            timestamp: Date.now(),
            model: modelName
          }
        }
      };
      
      this.emit('response', streamResponse);
    } catch (error) {
      this.log('Stream error:', error);
      throw error;
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  async handleCancel(request: CancelRequest): Promise<MCPResponse> {
    this.log('Handling cancel request:', request.params);
    
    if (!this.validateRequest(request, ['requestId'])) {
      throw this.createError(ERROR_CODES.INVALID_PARAMS, 'Missing requestId parameter');
    }

    const requestId = request.params.requestId;
    const abortController = this.activeRequests.get(requestId);

    if (abortController) {
      abortController.abort();
      this.activeRequests.delete(requestId);
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { cancelled: true }
      };
    }

    throw this.createError(ERROR_CODES.INVALID_REQUEST, 'Request not found or already completed');
  }

  async handleConfigure(request: ConfigureRequest): Promise<MCPResponse> {
    this.log('Handling configure request:', request.params);
    
    if (!this.validateRequest(request, ['configuration'])) {
      throw this.createError(ERROR_CODES.INVALID_PARAMS, 'Missing configuration parameter');
    }

    // Update configuration
    const config = request.params.configuration;
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { configured: true }
    };
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    this.log('Handling request:', request.method);

    try {
      switch (request.method) {
        case 'initialize':
          return await this.handleInitialize(request);

        case 'generate':
          return await this.handleGenerate(request as GenerateRequest);

        case 'stream':
          await this.handleStream(request as StreamRequest);
          return { jsonrpc: '2.0', id: request.id, result: { started: true } };

        case 'cancel':
          return await this.handleCancel(request as CancelRequest);

        case 'configure':
          return await this.handleConfigure(request as ConfigureRequest);

        default:
          throw new Error(`Method not found: ${request.method}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Method not found')) {
          throw this.createError(ERROR_CODES.METHOD_NOT_FOUND, error.message);
        }
        if (error.message.includes('Invalid or missing')) {
          throw this.createError(ERROR_CODES.INVALID_PARAMS, error.message);
        }
      }
      throw this.createError(ERROR_CODES.INTERNAL_ERROR, 'Internal server error');
    }
  }

  cancelRequest(requestId: string | number): void {
    const abortController = this.activeRequests.get(requestId);
    if (abortController) {
      abortController.abort();
      this.activeRequests.delete(requestId);
    }
  }

  private createError(code: number, message: string) {
    return {
      code,
      message
    };
  }
}