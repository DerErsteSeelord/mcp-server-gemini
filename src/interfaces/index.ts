export * from './completion.js';
export * from './resources.js';
export * from './prompts.js';

export interface CompletionArgument {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface Completion {
  content: string;
  metadata?: {
    model?: string;
    provider?: string;
    temperature?: number;
    maxTokens?: number;
    tokens?: number;
  };
}

export interface BaseProvider {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getCapabilities(): Record<string, any>;
}

export interface CompletionProvider extends BaseProvider {
  complete(argument: CompletionArgument): Promise<Completion>;
}

export interface ContentProvider extends BaseProvider {
  generateContent(prompt: string, options?: any): Promise<string>;
  streamContent?(prompt: string, options?: any): AsyncIterator<string>;
}