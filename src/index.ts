#!/usr/bin/env node
/**
 * Facultad de Informática UNLP Weather Station MCP Server
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // This message goes to stderr, so it won't interfere with the MCP protocol
  console.error("[INFO] Facultad de Informática UNLP Weather Station MCP Server started successfully");
}

// Handle errors and start the server
main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});