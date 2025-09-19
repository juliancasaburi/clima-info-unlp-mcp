/**
 * Test script for both MCP server and Lambda function
 * Author: Julián Casaburi
 * License: MIT
 */

import { fetchWeatherData } from './weather-core.js';

async function testWeatherData() {
  console.log('🌤️  Testing weather data fetch...\n');
  
  try {
    const weather = await fetchWeatherData();
    
    console.log('✅ Weather data fetched successfully!');
    console.log('📊 Data received:');
    console.log(`   🌡️  Temperature: ${weather.temperature}°C`);
    console.log(`   💧 Humidity: ${weather.humidity}%`);
    console.log(`   📊 Pressure: ${weather.bar} hPa`);
    console.log(`   💨 Wind: ${weather.wind_speed} km/h ${weather.wind_direction}`);
    console.log(`   ☀️  UV Index: ${weather.uv}`);
    console.log(`   🌧️  Rain: ${weather.rain} mm`);
    console.log(`   📅 Captured: ${new Date(weather.captured_at).toLocaleString()}\n`);
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testWeatherData();