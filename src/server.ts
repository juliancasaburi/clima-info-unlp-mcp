/**
 * Simple HTTP server for testing Lambda function locally
 * Author: Julián Casaburi
 * License: MIT
 */

import { createServer } from 'http';
import { URL } from 'url';
import { handler } from './lambda.js';

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  try {
    // Convert Node.js request to API Gateway event format
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    
    const event = {
      httpMethod: req.method || 'GET',
      path: url.pathname,
      queryStringParameters: Object.fromEntries(url.searchParams),
      headers: req.headers as Record<string, string>,
      body: null as string | null,
      isBase64Encoded: false,
      pathParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
      multiValueHeaders: {},
      multiValueQueryStringParameters: null
    };

    // Handle POST requests with body
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        event.body = body;
        await processRequest();
      });
    } else {
      await processRequest();
    }

    async function processRequest() {
      try {
        const result = await handler(event, {} as any);
        
        // Set response headers
        if (result.headers) {
          Object.entries(result.headers).forEach(([key, value]) => {
            res.setHeader(key, value as string);
          });
        }
        
        res.statusCode = result.statusCode;
        res.end(result.body);
      } catch (error) {
        console.error('Handler error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : String(error)
        }));
      }
    }
  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Internal server error'
    }));
  }
});

server.listen(PORT, () => {
  console.log(`🌤️  UNLP Weather Station API Server running on http://localhost:${PORT}`);
  console.log(`📍 Available endpoints:`);
  console.log(`   GET /current - All weather data`);
  console.log(`   GET /temperature - Temperature only`);
  console.log(`   GET /parameter/{param} - Specific parameter`);
  console.log(`\n🧪 Test with:`);
  console.log(`   curl http://localhost:${PORT}/current`);
  console.log(`   curl http://localhost:${PORT}/temperature`);
  console.log(`   curl http://localhost:${PORT}/parameter/humidity`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});