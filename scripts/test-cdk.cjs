#!/usr/bin/env node

// Simple script to test CDK deployment without actually deploying
// This will validate the CDK template and show what would be created

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testCdkDeployment() {
  console.log('🔧 Testing CDK deployment for API Gateway MCP...');
  
  // Check if package exists
  const packagePath = path.join(__dirname, '..', 'dist', 'clima-info-unlp-mcp-api-gateway.zip');
  if (!fs.existsSync(packagePath)) {
    console.log('📦 Package not found, creating it...');
    execSync('npm run package:api-gateway', { stdio: 'inherit' });
  } else {
    console.log('✅ Package exists:', packagePath);
  }

  // Install CDK dependencies if not present
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = ['aws-cdk-lib', 'constructs', 'cdk-nag'];
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );

  if (missingDeps.length > 0) {
    console.log('📥 Installing CDK dependencies:', missingDeps.join(', '));
    execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { stdio: 'inherit' });
  } else {
    console.log('✅ CDK dependencies already installed');
  }

  try {
    // Test CDK synth (validate template without deploying)
    console.log('🧪 Validating CDK template...');
    execSync('npx cdk synth --app "npx tsx cdk-stack.ts" --output cdk.out', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('');
    console.log('✅ CDK template validation successful!');
    console.log('');
    console.log('📋 To deploy:');
    console.log('   npx cdk deploy --app "npx tsx cdk-stack.ts"');
    console.log('');
    console.log('📋 To see what will be created:');
    console.log('   npx cdk diff --app "npx tsx cdk-stack.ts"');
    console.log('');
    console.log('🗂️  Generated CloudFormation template: cdk.out/');
    
  } catch (error) {
    console.error('❌ CDK validation failed:', error.message);
    console.log('');
    console.log('💡 Make sure you have:');
    console.log('   1. AWS CLI configured: aws configure');
    console.log('   2. CDK bootstrapped: npx cdk bootstrap');
    console.log('   3. Required permissions for Lambda and API Gateway');
  }
}

testCdkDeployment().catch(console.error);