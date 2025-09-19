/**
 * Core weather functionality for Facultad de Informática UNLP Weather Station MCP Server
 * Author: Julián Casaburi
 * License: MIT
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Interface for Facultad de Informática UNLP weather data
export interface WeatherData {
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

// Utility function to fetch weather data
export async function fetchWeatherData(): Promise<WeatherData> {
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
export function formatTemperature(temp: number): string {
  return `${temp}°C`;
}

// Format pressure with units
export function formatPressure(pressure: number): string {
  return `${pressure} hPa`;
}

// Format humidity with units
export function formatHumidity(humidity: number): string {
  return `${humidity}%`;
}

// Format wind speed with units
export function formatWindSpeed(speed: number): string {
  return `${speed} km/h`;
}

// Format UV index
export function formatUV(uv: number): string {
  let level = "Unknown";
  if (uv <= 2) level = "Low";
  else if (uv <= 5) level = "Moderate";
  else if (uv <= 7) level = "High";
  else if (uv <= 10) level = "Very High";
  else level = "Extreme";
  
  return `${uv} (${level})`;
}

// Register all weather tools on the server
export function createWeatherTools(server: McpServer): void {
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
          `🌡️ **Temperature:** ${formatTemperature(weather.temperature)}`,
          `🌡️ **Feels like:** ${formatTemperature(weather.wind_chill)}`,
          `💧 **Humidity:** ${formatHumidity(weather.humidity)}`,
          `🌡️ **Dew Point:** ${formatTemperature(weather.dew)}`,
          `📊 **Pressure:** ${formatPressure(weather.bar)}`,
          `💨 **Wind Speed:** ${formatWindSpeed(weather.wind_speed)}`,
          `🧭 **Wind Direction:** ${weather.wind_direction}`,
          `☀️ **UV Index:** ${formatUV(weather.uv)}`,
          `🌧️ **Rain:** ${weather.rain} mm`,
          `⛈️ **Rain Rate:** ${weather.rain_rate} mm/h`
        ];
        
        return {
          content: [
            {
              type: "text",
              text: report.join("\n")
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
              text: `🌡️ **Temperature at UNLP:** ${formatTemperature(weather.temperature)}\n🌡️ **Feels like:** ${formatTemperature(weather.wind_chill)}\n\n*Data from ${new Date(weather.captured_at).toLocaleString()}*`
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
    async (args: { parameter: string }): Promise<CallToolResult> => {
      try {
        const weather = await fetchWeatherData();
        let value: string;
        let emoji: string;
        
        switch (args.parameter) {
          case "temperature":
            value = formatTemperature(weather.temperature);
            emoji = "🌡️";
            break;
          case "humidity":
            value = formatHumidity(weather.humidity);
            emoji = "💧";
            break;
          case "pressure":
            value = formatPressure(weather.bar);
            emoji = "📊";
            break;
          case "wind_speed":
            value = formatWindSpeed(weather.wind_speed);
            emoji = "💨";
            break;
          case "wind_direction":
            value = weather.wind_direction;
            emoji = "🧭";
            break;
          case "uv":
            value = formatUV(weather.uv);
            emoji = "☀️";
            break;
          case "rain":
            value = `${weather.rain} mm`;
            emoji = "🌧️";
            break;
          case "rain_rate":
            value = `${weather.rain_rate} mm/h`;
            emoji = "⛈️";
            break;
          case "dew_point":
            value = formatTemperature(weather.dew);
            emoji = "🌡️";
            break;
          case "wind_chill":
            value = formatTemperature(weather.wind_chill);
            emoji = "🌡️";
            break;
          default:
            throw new Error(`Unknown parameter: ${args.parameter}`);
        }
        
        const parameterName = args.parameter.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
        
        return {
          content: [
            {
              type: "text",
              text: `${emoji} **${parameterName}:** ${value}\n\n*Data from ${new Date(weather.captured_at).toLocaleString()}*`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching ${args.parameter} data: ${error}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Analyze weather conditions tool
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
        const analysis: string[] = [];
        
        // Temperature analysis
        if (weather.temperature < 10) {
          analysis.push("🥶 It's quite cold today.");
        } else if (weather.temperature > 25) {
          analysis.push("🌡️ It's a warm day.");
        } else {
          analysis.push("🌤️ Temperature is pleasant.");
        }
        
        // Humidity analysis
        if (weather.humidity > 80) {
          analysis.push("💧 High humidity levels - might feel muggy.");
        } else if (weather.humidity < 30) {
          analysis.push("🏜️ Low humidity - air is quite dry.");
        }
        
        // Wind analysis
        if (weather.wind_speed > 20) {
          analysis.push("💨 Strong winds present.");
        } else if (weather.wind_speed < 5) {
          analysis.push("🍃 Very light winds or calm conditions.");
        }
        
        // Pressure analysis
        if (weather.bar < 1013) {
          analysis.push("📉 Low pressure system - weather changes possible.");
        } else if (weather.bar > 1020) {
          analysis.push("📈 High pressure system - stable weather likely.");
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
}