export interface MCPMessage {
  jsonrpc: '2.0';
  id: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: MCPError;
}

export interface MCPRequest extends MCPMessage {
  method: string;
  params: any;
}

export interface MCPResponse extends MCPMessage {
  result?: any;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

export interface StreamRequest extends MCPRequest {
  params: {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    streamEvents?: boolean;
  };
}

export interface StreamResponse extends MCPResponse {
  result: {
    type: 'stream';
    content: string;
    done: boolean;
    metadata?: {
      timestamp: number;
      model: string;
      tokens?: number;
    };
  };
}

export interface GenerateRequest extends MCPRequest {
  params: {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
  };
}

export interface GenerateResponse extends MCPResponse {
  result: {
    type: 'completion';
    content: string;
    metadata: {
      model: string;
      provider: string;
      temperature?: number;
      maxTokens?: number;
      stopSequences?: string[];
    };
  };
}

export interface CancelRequest extends MCPRequest {
  params: {
    requestId: string | number;
  };
}

export interface ConfigureRequest extends MCPRequest {
  params: {
    configuration: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stopSequences?: string[];
      timeout?: number;
    };
  };
}

export interface ServerCapabilities {
  experimental: Record<string, any>;
  prompts: { listChanged: boolean };
  resources: { subscribe: boolean; listChanged: boolean };
  tools: { listChanged: boolean };
  logging: Record<string, any>;
}

export interface ServerInfo {
  name: string;
  version: string;
}

export interface InitializeResult {
  protocolVersion: string;
  serverInfo: ServerInfo;
  capabilities: ServerCapabilities;
}