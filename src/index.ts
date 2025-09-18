#!/usr/bin/env node
/**
 * Facultad de Informática UNLP Weather Station MCP Server
 * Author: Julián Casaburi
 * License: MIT
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Interface for Facultad de Informática UNLP weather data
interface WeatherData {
  captured_at: string;
  temperature: number;
  humidity: number;
  dew: number;
  bar: number;
  uv: number;
  wind_chill: number;
  wind_speed: number;
  rain: number;
  rain_rate: number;
  wind_direction: string;
}

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

// Utility function to fetch weather data
async function fetchWeatherData(): Promise<WeatherData> {
  try {
    const response = await fetch("https://clima.info.unlp.edu.ar/last?lang=es");
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as WeatherData;
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch weather data: ${error}`);
  }
}

// Format temperature with units
function formatTemperature(temp: number): string {
  return `${temp}°C`;
}

// Format pressure with units
function formatPressure(pressure: number): string {
  return `${pressure} hPa`;
}

// Format humidity with units
function formatHumidity(humidity: number): string {
  return `${humidity}%`;
}

// Format wind speed with units
function formatWindSpeed(speed: number): string {
  return `${speed} km/h`;
}

// Format UV index
function formatUV(uv: number): string {
  let level = "Unknown";
  if (uv <= 2) level = "Low";
  else if (uv <= 5) level = "Moderate";
  else if (uv <= 7) level = "High";
  else if (uv <= 10) level = "Very High";
  else level = "Extreme";
  
  return `${uv} (${level})`;
}

// Get current weather tool
server.registerTool(
  "get_current_weather",
  {
    title: "Get Current Weather",
    description: "Get current weather conditions from Facultad de Informática UNLP weather station",
    inputSchema: {}
  },
  async (): Promise<CallToolResult> => {
    try {
      const weather = await fetchWeatherData();
      
      const report = [
        "🌡️ **Current Weather Conditions at UNLP**",
        "",
        `📅 **Captured:** ${new Date(weather.captured_at).toLocaleString()}`,
        "",
        "**Temperature & Feel:**",
        `• Temperature: ${formatTemperature(weather.temperature)}`,
        `• Wind Chill: ${formatTemperature(weather.wind_chill)}`,
        `• Dew Point: ${formatTemperature(weather.dew)}`,
        "",
        "**Atmospheric Conditions:**",
        `• Humidity: ${formatHumidity(weather.humidity)}`,
        `• Pressure: ${formatPressure(weather.bar)}`,
        `• UV Index: ${formatUV(weather.uv)}`,
        "",
        "**Wind & Precipitation:**",
        `• Wind Speed: ${formatWindSpeed(weather.wind_speed)}`,
        `• Wind Direction: ${weather.wind_direction}`,
        `• Current Rain: ${weather.rain} mm`,
        `• Rain Rate: ${weather.rain_rate} mm/h`,
        "",
        "---",
        "*Data from clima.info.unlp.edu.ar weather station*"
      ].join("\n");

      return {
        content: [
          {
            type: "text",
            text: report
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching weather data: ${error}`
          }
        ],
        isError: true
      };
    }
  }
);

// Get temperature tool
server.registerTool(
  "get_temperature",
  {
    title: "Get Temperature",
    description: "Get current temperature from Facultad de Informática UNLP weather station",
    inputSchema: {}
  },
  async (): Promise<CallToolResult> => {
    try {
      const weather = await fetchWeatherData();
      
      return {
        content: [
          {
            type: "text",
            text: `Current temperature at UNLP: ${formatTemperature(weather.temperature)} (feels like ${formatTemperature(weather.wind_chill)})`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching temperature data: ${error}`
          }
        ],
        isError: true
      };
    }
  }
);

// Get specific weather parameter tool
server.registerTool(
  "get_weather_parameter",
  {
    title: "Get Weather Parameter",
    description: "Get a specific weather parameter from Facultad de Informática UNLP weather station",
    inputSchema: {
      parameter: z.enum([
        "temperature", 
        "humidity", 
        "pressure", 
        "wind_speed", 
        "wind_direction", 
        "uv", 
        "rain", 
        "rain_rate",
        "dew_point",
        "wind_chill"
      ]).describe("The weather parameter to retrieve")
    }
  },
  async ({ parameter }): Promise<CallToolResult> => {
    try {
      const weather = await fetchWeatherData();
      
      let result: string;
      
      switch (parameter) {
        case "temperature":
          result = `Temperature: ${formatTemperature(weather.temperature)}`;
          break;
        case "humidity":
          result = `Humidity: ${formatHumidity(weather.humidity)}`;
          break;
        case "pressure":
          result = `Atmospheric Pressure: ${formatPressure(weather.bar)}`;
          break;
        case "wind_speed":
          result = `Wind Speed: ${formatWindSpeed(weather.wind_speed)}`;
          break;
        case "wind_direction":
          result = `Wind Direction: ${weather.wind_direction}`;
          break;
        case "uv":
          result = `UV Index: ${formatUV(weather.uv)}`;
          break;
        case "rain":
          result = `Current Rain: ${weather.rain} mm`;
          break;
        case "rain_rate":
          result = `Rain Rate: ${weather.rain_rate} mm/h`;
          break;
        case "dew_point":
          result = `Dew Point: ${formatTemperature(weather.dew)}`;
          break;
        case "wind_chill":
          result = `Wind Chill: ${formatTemperature(weather.wind_chill)}`;
          break;
        default:
          result = "Unknown parameter";
      }
      
      return {
        content: [
          {
            type: "text",
            text: result
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching weather parameter: ${error}`
          }
        ],
        isError: true
      };
    }
  }
);

// Weather conditions analysis tool
server.registerTool(
  "analyze_weather_conditions",
  {
    title: "Analyze Weather Conditions",
    description: "Analyze current weather conditions and provide insights",
    inputSchema: {}
  },
  async (): Promise<CallToolResult> => {
    try {
      const weather = await fetchWeatherData();
      
      const analysis = [];
      
      // Temperature analysis
      if (weather.temperature < 10) {
        analysis.push("🥶 It's quite cold outside.");
      } else if (weather.temperature > 25) {
        analysis.push("🌡️ It's warm outside.");
      } else {
        analysis.push("🌤️ Temperature is comfortable.");
      }
      
      // Humidity analysis
      if (weather.humidity > 80) {
        analysis.push("💧 High humidity - it feels muggy.");
      } else if (weather.humidity < 30) {
        analysis.push("🏜️ Low humidity - air is quite dry.");
      }
      
      // Wind analysis
      if (weather.wind_speed > 20) {
        analysis.push("💨 It's windy outside.");
      } else if (weather.wind_speed < 5) {
        analysis.push("🍃 Very light winds or calm conditions.");
      }
      
      // Rain analysis
      if (weather.rain > 0) {
        analysis.push("🌧️ Currently raining.");
      }
      if (weather.rain_rate > 0) {
        analysis.push(`⛈️ Rain rate: ${weather.rain_rate} mm/h`);
      }
      
      // UV analysis
      if (weather.uv > 7) {
        analysis.push("☀️ High UV levels - sun protection recommended.");
      } else if (weather.uv > 3) {
        analysis.push("🌤️ Moderate UV levels.");
      }
      
      // Wind chill analysis
      const tempDiff = weather.temperature - weather.wind_chill;
      if (tempDiff > 2) {
        analysis.push(`❄️ Wind chill makes it feel ${tempDiff.toFixed(1)}°C colder.`);
      }
      
      const analysisText = analysis.length > 0 
        ? analysis.join("\n• ") 
        : "Conditions appear normal.";
      
      return {
        content: [
          {
            type: "text",
            text: `**Weather Analysis for UNLP:**\n\n• ${analysisText}\n\n*Based on data from ${new Date(weather.captured_at).toLocaleString()}*`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing weather conditions: ${error}`
          }
        ],
        isError: true
      };
    }
  }
);

// Main function to start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // This message goes to stderr, so it won't interfere with the MCP protocol
  console.error("Facultad de Informática UNLP Weather Station MCP Server is running...");
}

// Handle errors and start the server
main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});