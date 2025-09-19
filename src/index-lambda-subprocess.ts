#!/usr/bin/env node
/**
 * Lambda-optimized Facultad de Informática UNLP Weather Station MCP Server
 * This version is specifically designed to work as a subprocess in AWS Lambda
 * Author: Julián Casaburi
 * License: MIT
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWeatherTools } from "./weather-core.js";

// Create the MCP server
const server = new McpServer({
  name: "clima-info-unlp-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
    resources: {}
  }
});

// Register weather tools
createWeatherTools(server);

// Main function to start the server
async function main() {
  try {
    // Set up error handling for subprocess environment
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });

    // Create stdio transport
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await server.connect(transport);
    
    // Use stderr for logging to avoid interfering with MCP protocol on stdout
    // This is informational, not an error, but must use stderr in MCP context
    console.error("[INFO] Facultad de Informática UNLP Weather Station MCP Server (Lambda subprocess) started successfully");
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.error('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.error('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("Server startup error:", error);
  process.exit(1);
});