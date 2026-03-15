import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolRegistry, ToolName } from '@aiready/core';

// Pre-load essential tools (following CLI pattern)
// In a real implementation, we would want to dynamically load these
// or have them as peer dependencies.
import '@aiready/pattern-detect';
import '@aiready/context-analyzer';
import '@aiready/consistency';

/**
 * AIReady MCP Server Implementation
 */
export class AIReadyMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'aiready-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();

    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const providers = ToolRegistry.getAll();

      return {
        tools: providers.map((p) => ({
          name: p.id,
          description: `AIReady analysis tool: ${p.id}`,
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the directory to analyze',
              },
              // Future: expose tool-specific options
            },
            required: ['path'],
          },
        })),
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const provider = ToolRegistry.find(name);
        if (!provider) {
          throw new Error(`Tool ${name} not found`);
        }

        if (!args || typeof args.path !== 'string') {
          throw new Error('Missing required argument: path');
        }

        console.error(`[MCP] Executing ${name} on ${args.path}`);

        const results = await provider.analyze({
          rootDir: args.path,
        });

        // Format results for the agent
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AIReady MCP Server started');
  }

  getServer(): Server {
    return this.server;
  }
}

export function createSandboxServer(): Server {
  const mcp = new AIReadyMcpServer();
  return mcp.getServer();
}

// Bootstrap the server
const mcpServer = new AIReadyMcpServer();
mcpServer.run().catch((error) => {
  console.error('Fatal error starting AIReady MCP Server:', error);
  process.exit(1);
});

export default mcpServer;
