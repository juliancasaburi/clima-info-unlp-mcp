# Facultad de Informática UNLP Weather Station MCP Server

A Model Context Protocol (MCP) server that provides access to real-time weather data from the weather station at the Facultad de Informática, Universidad Nacional de La Plata (UNLP), in La Plata, Argentina.

## Overview

This MCP server connects to the Facultad de Informática's weather station and provides tools to access current weather conditions including temperature, humidity, pressure, wind data, UV index, and precipitation information. Data is sourced from the Facultad de Informática UNLP weather station platform at [clima.info.unlp.edu.ar](https://clima.info.unlp.edu.ar/).

## About the Station

For more information about the weather station, see the official article: https://www.info.unlp.edu.ar/estacion/

## Features

### Tools Available

1. **get_current_weather** - Get comprehensive current weather conditions
2. **get_temperature** - Get current temperature and feels-like temperature  
3. **get_weather_parameter** - Get specific weather parameters:
   - temperature
   - humidity
   - pressure
   - wind_speed
   - wind_direction
   - uv
   - rain
   - rain_rate
   - dew_point
   - wind_chill
4. **analyze_weather_conditions** - Get intelligent analysis of current weather conditions

### Data Source

The server fetches data from: `https://clima.info.unlp.edu.ar/last?lang=es`

Sample data format:
```json
{
  "captured_at": "2025-09-18T02:55:00.000Z",
  "temperature": 15,
  "humidity": 87,
  "dew": 13,
  "bar": 1017,
  "uv": 0,
  "wind_chill": 15,
  "wind_speed": 0,
  "rain": 0,
  "rain_rate": 0,
  "wind_direction": "---"
}
```

## Installation

1. Clone this repository:
```bash
git clone git@github.com:juliancasaburi/clima-info-unlp-mcp.git
cd clima-info-unlp-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### With Claude Desktop

For a step-by-step guide to setting up local MCP servers with Claude Desktop, see [Getting Started with Local MCP Servers on Claude Desktop](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop).

### With VS Code

Use the included `.vscode/mcp.json` configuration file.

For a detailed guide on integrating MCP servers with VS Code, see the official documentation: [Customizing MCP Servers in VS Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).

### Direct Usage

Run the server directly:
```bash
npm start
```

Or for development:
```bash
npm run dev
```

## Example Interactions

### Get Current Weather
Ask: "What's the current weather at UNLP?"

### Get Specific Information  
Ask: "What's the current temperature at UNLP?" or "What's the humidity level?"

### Weather Analysis
Ask: "Analyze the current weather conditions at UNLP"

## Development

### Project Structure
```
├── src/
│   └── index.ts          # Main server implementation
├── build/                # Compiled JavaScript output
├── .vscode/
│   └── mcp.json         # VS Code MCP configuration
├── .github/
│   └── workflows/       # GitHub Actions workflows
├── package.json
├── tsconfig.json
└── README.md
```

### Available Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled server
- `npm run dev` - Run in development mode with tsx
- `npm test` - Build and test the server

## Technical Details

- **Language:** TypeScript
- **Runtime:** Node.js
- **MCP SDK:** @modelcontextprotocol/sdk
- **Transport:** Standard I/O (stdio)
- **Data Format:** JSON

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
