# Examples and Usage Instructions

## Claude Desktop Setup

1. **Locate the Configuration File**
   ```
   Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
   Windows: %APPDATA%\Claude\claude_desktop_config.json
   Linux: ~/.config/Claude/claude_desktop_config.json
   ```

2. **Add Gemini MCP Configuration**
   ```json
   {
     "mcpServers": {
       "gemini": {
         "command": "npx",
         "args": ["-y", "github:aliargun/mcp-server-gemini"],
         "env": {
           "GEMINI_API_KEY": "your_api_key_here",
           "GEMINI_MODEL": "gemini-pro"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**
   - Close Claude Desktop completely
   - Relaunch the application
   - The Gemini provider should now be available

## Example Interactions

### Basic Usage
```
Claude: I can now access Gemini through the MCP connection. Would you like me to compare our responses to a question?

Human: Yes, please compare how we respond to: "Explain quantum computing in simple terms."

Claude: I'll use both my own knowledge and ask Gemini through the MCP connection...
```

### Advanced Features

1. **Parameter Control**
   ```json
   {
     "method": "generate",
     "params": {
       "prompt": "Your prompt here",
       "model": "gemini-1.5-pro",
       "temperature": 0.7,
       "maxTokens": 1000
     }
   }
   ```

2. **Streaming Responses**
   ```json
   {
     "method": "generate",
     "params": {
       "prompt": "Your prompt here",
       "stream": true
     }
   }
   ```

## Troubleshooting Common Setup Issues

1. **Config File Not Found**
   - Make sure Claude Desktop has been run at least once
   - Check the path for your operating system
   - Create the file if it doesn't exist

2. **API Key Issues**
   - Get your API key from Google AI Studio
   - Ensure the key has proper permissions
   - Check for any whitespace in the key

3. **Connection Issues**
   - Verify Claude Desktop is running
   - Check if port 3071 is available (default port)
   - Look for any firewall restrictions

## Best Practices

1. **API Key Security**
   - Never share your API key
   - Use environment variables when possible
   - Rotate keys periodically

2. **Resource Management**
   - Monitor API usage
   - Implement rate limiting
   - Handle long responses appropriately

## Advanced Configuration

### Custom Port Configuration
```json
{
  "mcpServers": {
    "gemini": {
      "command": "npx",
      "args": ["-y", "github:aliargun/mcp-server-gemini"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here",
        "PORT": "3006"
      }
    }
  }
}
```

**Note:** By default, the server runs on port 3071. You can override this with the PORT environment variable.

### Development Setup
```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["/path/to/local/mcp-server-gemini/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here",
        "DEBUG": "true"
      }
    }
  }
}
```

## Using with Other MCP Servers

### Multiple Providers Example
```json
{
  "mcpServers": {
    "gemini": {
      "command": "npx",
      "args": ["-y", "github:aliargun/mcp-server-gemini"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_key"
      }
    },
    "openai": {
      "command": "npx",
      "args": ["-y", "@mzxrai/mcp-openai@latest"],
      "env": {
        "OPENAI_API_KEY": "your_openai_key"
      }
    }
  }
}
```

## Verification Steps

1. Check Server Status
```bash
curl -I http://localhost:3071
```

2. Test WebSocket Connection
```bash
wscat -c ws://localhost:3071
```

3. Verify MCP Integration
```
Ask Claude: "Can you verify if the Gemini MCP connection is working?"
```

## Model Selection

### Setting Default Model via Environment
Set the default model for all requests using the `GEMINI_MODEL` environment variable:

```json
{
  "mcpServers": {
    "gemini": {
      "command": "npx",
      "args": ["-y", "github:aliargun/mcp-server-gemini"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here",
        "GEMINI_MODEL": "gemini-1.5-pro"
      }
    }
  }
}
```

### Selecting Model at Runtime
You can specify a different model for each request:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "generate",
  "params": {
    "prompt": "Explain quantum computing in simple terms",
    "model": "gemini-1.5-pro",
    "temperature": 0.5
  }
}
```

### Available Gemini Models
Depending on your API key access level, you can use various models:

- `gemini-pro` - Standard model (default)
- `gemini-1.5-pro` - Upgraded version with enhanced capabilities
- `gemini-1.5-flash` - Faster model for quicker responses
- `gemini-pro-vision` - For image understanding (requires different API format)
