#!/usr/bin/env node
import {
  Handler,
  Context,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import {
  LambdaFunctionURLEventHandler,
  StdioServerAdapterRequestHandler,
} from "@aws/run-mcp-servers-with-aws-lambda";

// For the AWS Labs approach, we need to run our MCP server as a subprocess
// The serverParams define how to invoke our existing MCP server
const serverParams = {
  command: "node",
  args: [
    "/var/task/build/index.js", // Our compiled MCP server entry point
  ],
};

// Create the AWS Labs handler that wraps our stdio MCP server
const requestHandler = new LambdaFunctionURLEventHandler(
  new StdioServerAdapterRequestHandler(serverParams)
);

// Lambda handler function with proper types
export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  return requestHandler.handle(event, context);
};