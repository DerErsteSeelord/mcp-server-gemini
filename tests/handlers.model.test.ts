import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MCPHandlers } from '../src/handlers.js';
import { ERROR_CODES } from '../src/protocol.js';
import { MCPRequest, GenerateRequest } from '../src/types/protocols.js';

describe('MCP Handlers', () => {
  const mockModel = {
    generateContent: jest.fn().mockResolvedValue({
      response: {
        text: () => 'Generated text'
      }
    })
  };

  const mockGoogleGenerativeAI = {
    getGenerativeModel: jest.fn().mockReturnValue(mockModel)
  };

  const mockProtocol = {
    createInitializeResult: jest.fn().mockReturnValue({
      protocolVersion: '2024-11-05',
      serverInfo: { name: 'test', version: '1.0.0' },
      capabilities: {}
    })
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const handlers = new MCPHandlers(
    mockModel as any, 
    mockProtocol as any, 
    mockGoogleGenerativeAI as any, 
    'gemini-pro'
  );

  describe('handleInitialize', () => {
    it('should return correct initialize response', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      } as unknown as MCPRequest;

      const response = await handlers.handleInitialize(request);

      expect(response).toMatchObject({
        jsonrpc: '2.0',
        id: 1,
        result: expect.any(Object)
      });
    });
  });

  describe('handleGenerate', () => {
    it('should handle missing prompt parameter', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'generate',
        params: {}
      } as unknown as GenerateRequest;

      await expect(handlers.handleGenerate(request)).rejects.toThrow();
    });

    it('should handle successful generation with default model', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'generate',
        params: {
          prompt: 'Test prompt'
        }
      } as unknown as GenerateRequest;

      const response = await handlers.handleGenerate(request);

      expect(response).toMatchObject({
        jsonrpc: '2.0',
        id: 1,
        result: {
          type: 'completion',
          content: 'Generated text',
          metadata: {
            model: 'gemini-pro'
          }
        }
      });
    });

    it('should use specified model when provided', async () => {
      // Create a custom model mock
      const customModelMock = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Custom model response'
          }
        })
      };
      
      // Setup mock to return custom model
      mockGoogleGenerativeAI.getGenerativeModel.mockReturnValue(customModelMock);

      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'generate',
        params: {
          prompt: 'Test prompt',
          model: 'gemini-1.5-pro'
        }
      } as unknown as GenerateRequest;

      const response = await handlers.handleGenerate(request);

      // Verify the Google AI client was called with correct model
      expect(mockGoogleGenerativeAI.getGenerativeModel).toHaveBeenCalledWith({ 
        model: 'gemini-1.5-pro' 
      });
      
      // Verify response includes the correct model
      expect(response.result.metadata.model).toBe('gemini-1.5-pro');
    });
  });
});
