/**
 * MCP (Model Context Protocol) - Supply Chain Platform
 * JSON-RPC 2.0 compliant tool protocol for multi-domain orchestration
 *
 * Adapted from HMS Aurora Portal enterprise MCP architecture
 */

// ============================================
// MCP Protocol Types
// ============================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPPropertySchema>;
    required?: string[];
  };
}

export interface MCPPropertySchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: MCPPropertySchema;
  default?: unknown;
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  success: boolean;
  content: MCPContent[];
  isError?: boolean;
}

export interface MCPContent {
  type: 'text' | 'json' | 'image' | 'resource';
  text?: string;
  data?: unknown;
  mimeType?: string;
  uri?: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// ============================================
// MCP Request/Response (JSON-RPC 2.0)
// ============================================

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export const MCPErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  TOOL_NOT_FOUND: -32000,
  UNAUTHORIZED: -32001,
  RATE_LIMITED: -32002,
} as const;

// ============================================
// MCP Server Base Class
// ============================================

export abstract class BaseMCPServer {
  abstract name: string;
  abstract version: string;
  abstract description: string;

  protected tools: Map<string, MCPTool> = new Map();
  protected toolHandlers: Map<string, (args: Record<string, unknown>) => Promise<MCPToolResult>> = new Map();

  protected registerTool(
    tool: MCPTool,
    handler: (args: Record<string, unknown>) => Promise<MCPToolResult>
  ): void {
    this.tools.set(tool.name, tool);
    this.toolHandlers.set(tool.name, handler);
  }

  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  async callTool(call: MCPToolCall): Promise<MCPToolResult> {
    const handler = this.toolHandlers.get(call.name);
    if (!handler) {
      return createErrorResult(`Tool '${call.name}' not found in ${this.name}`);
    }
    try {
      return await handler(call.arguments);
    } catch (error) {
      return createErrorResult(
        `Error executing '${call.name}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const { id, method, params } = request;
    try {
      switch (method) {
        case 'initialize':
          return {
            jsonrpc: '2.0', id,
            result: {
              serverInfo: { name: this.name, version: this.version },
              capabilities: { tools: { listChanged: false } },
            },
          };
        case 'tools/list':
          return { jsonrpc: '2.0', id, result: { tools: this.listTools() } };
        case 'tools/call':
          const toolResult = await this.callTool({
            name: params?.name as string,
            arguments: (params?.arguments || {}) as Record<string, unknown>,
          });
          return { jsonrpc: '2.0', id, result: toolResult };
        default:
          return {
            jsonrpc: '2.0', id,
            error: { code: MCPErrorCodes.METHOD_NOT_FOUND, message: `Method '${method}' not found` },
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0', id,
        error: { code: MCPErrorCodes.INTERNAL_ERROR, message: error instanceof Error ? error.message : String(error) },
      };
    }
  }
}

// ============================================
// Utility Functions
// ============================================

export function createTextResult(text: string, success = true): MCPToolResult {
  return { success, content: [{ type: 'text', text }] };
}

export function createJsonResult(data: unknown, success = true): MCPToolResult {
  return { success, content: [{ type: 'json', data }] };
}

export function createErrorResult(message: string): MCPToolResult {
  return { success: false, isError: true, content: [{ type: 'text', text: message }] };
}

export function validateParams(
  args: Record<string, unknown>,
  required: string[]
): { valid: boolean; missing: string[] } {
  const missing = required.filter(param => args[param] === undefined || args[param] === null);
  return { valid: missing.length === 0, missing };
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount);
}
