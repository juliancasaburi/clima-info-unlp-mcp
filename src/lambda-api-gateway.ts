#!/usr/bin/env node
import {
  Handler,
  Context,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  APIGatewayProxyEventHandler,
  StdioServerAdapterRequestHandler,
} from "@aws/run-mcp-servers-with-aws-lambda";

// For the AWS Labs approach, we need to run our MCP server as a subprocess
// The serverParams define how to invoke our existing MCP server
const serverParams = {
  command: "node",
  args: [
    "/var/task/index-lambda-subprocess.js", // Lambda-optimized MCP server entry point
  ],
};

// Create the AWS Labs handler that wraps our stdio MCP server for API Gateway
const requestHandler = new APIGatewayProxyEventHandler(
  new StdioServerAdapterRequestHandler(serverParams)
);

// Lambda handler function with proper types for API Gateway
export const handler: Handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  return requestHandler.handle(event, context);
};