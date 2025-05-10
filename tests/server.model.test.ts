import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MCPServer } from '../src/server.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServer } from 'http';

// Helper function to get an available port
const getAvailablePort = () => {
  return new Promise<number>((resolve) => {
    const server = createServer();
    server.listen(0, () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });
};

// Mock external dependencies
jest.mock('@google/generative-ai');
jest.mock('ws');
jest.mock('http');
jest.mock('../src/handlers.js');
jest.mock('../src/protocol.js');

describe('MCPServer', () => {
  const mockGetGenerativeModel = jest.fn();
  let TEST_PORT: number;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    // Setup GoogleGenerativeAI mock
    // Use a different approach for ESM mocks
    (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel
    }));
    
    // Get a unique port for this test
    TEST_PORT = await getAvailablePort();
  });
  it('should initialize with default model when not specified', () => {
    // Save original env
    const originalEnv = process.env.GEMINI_MODEL;
    process.env.GEMINI_MODEL = undefined;
    
    try {
      // Create server with default settings
      new MCPServer('fake-api-key', TEST_PORT);
      
      // Verify default model was used
      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-pro'
      });
    } finally {
      // Restore original env
      process.env.GEMINI_MODEL = originalEnv;
    }
  });

  it('should initialize with constructor-provided model', () => {
    // Create server with custom model
    new MCPServer('fake-api-key', TEST_PORT, 'gemini-1.5-pro');
    
    // Verify custom model was used
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({
      model: 'gemini-1.5-pro'
    });
  });

  it('should use model from environment variable when available', () => {
    // Save original env and set test value
    const originalEnv = process.env.GEMINI_MODEL;
    process.env.GEMINI_MODEL = 'gemini-1.5-flash';
    
    try {
      // Create server
      new MCPServer('fake-api-key', TEST_PORT);
      
      // Verify env model was used
      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-1.5-flash'
      });
    } finally {
      // Restore original env
      process.env.GEMINI_MODEL = originalEnv;
    }
  });

  it('should prioritize environment variable over constructor parameter', () => {
    // Save original env and set test value
    const originalEnv = process.env.GEMINI_MODEL;
    process.env.GEMINI_MODEL = 'gemini-1.5-flash';
    
    try {
      // Create server with a different model in constructor
      new MCPServer('fake-api-key', TEST_PORT, 'gemini-1.5-pro');
      
      // Verify env model was used (not constructor model)
      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-1.5-flash'
      });
    } finally {
      // Restore original env
      process.env.GEMINI_MODEL = originalEnv;
    }
  });
});
