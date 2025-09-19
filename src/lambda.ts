/**
 * AWS Lambda handler for Facultad de Informática UNLP Weather Station MCP Server
 * Author: Julián Casaburi
 * License: MIT
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createWeatherTools, fetchWeatherData } from './weather-core.js';

// Create MCP server instance for Lambda
const server = new McpServer({
  name: "clima-info-unlp-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
    resources: {}
  }
});

// Register tools
createWeatherTools(server);

// Simple HTTP API for Lambda (non-MCP mode)
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle OPTIONS requests for CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    // Handle GET requests for simple weather data
    if (event.httpMethod === 'GET') {
      const path = event.path || '/';
      
      try {
        const weather = await fetchWeatherData();
        
        if (path === '/current' || path === '/') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              station: "Facultad de Informática UNLP",
              location: "La Plata, Argentina",
              data: weather,
              timestamp: new Date().toISOString()
            })
          };
        }
        
        if (path === '/temperature') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              temperature: weather.temperature,
              feels_like: weather.wind_chill,
              unit: "°C",
              captured_at: weather.captured_at
            })
          };
        }
        
        // Extract parameter from path like /parameter/temperature
        const paramMatch = path.match(/^\/parameter\/(.+)$/);
        if (paramMatch) {
          const param = paramMatch[1];
          const validParams = ["temperature", "humidity", "pressure", "wind_speed", "wind_direction", "uv", "rain", "rain_rate", "dew_point", "wind_chill"];
          
          if (validParams.includes(param)) {
            let value: any;
            switch (param) {
              case "temperature":
              case "dew_point":
              case "wind_chill":
                value = { value: weather[param as keyof typeof weather], unit: "°C" };
                break;
              case "humidity":
                value = { value: weather.humidity, unit: "%" };
                break;
              case "pressure":
                value = { value: weather.bar, unit: "hPa" };
                break;
              case "wind_speed":
                value = { value: weather.wind_speed, unit: "km/h" };
                break;
              case "rain":
                value = { value: weather.rain, unit: "mm" };
                break;
              case "rain_rate":
                value = { value: weather.rain_rate, unit: "mm/h" };
                break;
              default:
                value = { value: weather[param as keyof typeof weather] };
            }
            
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                parameter: param,
                ...value,
                captured_at: weather.captured_at
              })
            };
          }
        }
        
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Endpoint not found',
            available_endpoints: [
              '/current - Get all current weather data',
              '/temperature - Get current temperature',
              '/parameter/{param} - Get specific parameter (temperature, humidity, pressure, wind_speed, wind_direction, uv, rain, rain_rate, dew_point, wind_chill)'
            ]
          })
        };
        
      } catch (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch weather data',
            message: error instanceof Error ? error.message : String(error)
          })
        };
      }
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed',
        allowed_methods: ['GET', 'OPTIONS']
      })
    };
    
  } catch (error) {
    console.error('Lambda handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      })
    };
  }
};