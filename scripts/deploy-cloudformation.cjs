#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Deploy MCP Server using CloudFormation
 * This script creates the S3 bucket, uploads the package, and deploys the stack
 */

async function deployWithCloudFormation() {
  // Get stack name from command line args or use default
  const STACK_NAME = process.argv[2] || 'ClimaInfoMcpAwsLabsStack';
  const REGION = 'us-east-1';
  const PACKAGE_FILE = 'clima-info-unlp-mcp-api-gateway.zip';
  const PACKAGE_PATH = path.join(__dirname, '..', 'dist', PACKAGE_FILE);
  
  console.log('🚀 Deploying MCP Server with CloudFormation...');
  
  // Check if package exists
  if (!fs.existsSync(PACKAGE_PATH)) {
    console.log('📦 Package not found. Creating it first...');
    execSync('npm run package', { stdio: 'inherit' });
  }
  
  // Create unique S3 bucket name
  const timestamp = Date.now();
  const bucketName = `clima-info-mcp-deploy-${timestamp}`;
  
  try {
    console.log(`🪣 Creating S3 bucket: ${bucketName}`);
    execSync(`aws s3 mb s3://${bucketName} --region ${REGION}`, { stdio: 'inherit' });
    
    console.log('📤 Uploading Lambda package to S3...');
    execSync(`aws s3 cp "${PACKAGE_PATH}" s3://${bucketName}/${PACKAGE_FILE}`, { stdio: 'inherit' });
    
    console.log('☁️  Deploying CloudFormation stack...');
    const deployCmd = [
      'aws cloudformation deploy',
      `--template-file cloudformation-template.yaml`,
      `--stack-name ${STACK_NAME}`,
      `--parameter-overrides`,
      `CodeBucket=${bucketName}`,
      `CodeKey=${PACKAGE_FILE}`,
      `--capabilities CAPABILITY_NAMED_IAM`,
      `--region ${REGION}`
    ].join(' ');
    
    execSync(deployCmd, { stdio: 'inherit' });
    
    console.log('✅ CloudFormation deployment completed!');
    
    // Get stack outputs
    console.log('📋 Getting stack outputs...');
    const outputsCmd = `aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION} --query "Stacks[0].Outputs" --output table`;
    execSync(outputsCmd, { stdio: 'inherit' });
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    // Cleanup: delete S3 bucket if it was created
    try {
      console.log('🧹 Cleaning up S3 bucket...');
      execSync(`aws s3 rm s3://${bucketName} --recursive`, { stdio: 'inherit' });
      execSync(`aws s3 rb s3://${bucketName}`, { stdio: 'inherit' });
    } catch (cleanupError) {
      console.error('⚠️  Could not clean up S3 bucket:', cleanupError.message);
    }
    
    process.exit(1);
  }
  
  console.log('');
  console.log('🎉 Deployment successful!');
  console.log('💡 Your MCP server is now available via API Gateway');
  console.log('🔗 Use the McpServerUrl from the outputs above in your MCP client');
  console.log('');
  console.log('🧹 To clean up later, run:');
  console.log(`   aws cloudformation delete-stack --stack-name ${STACK_NAME} --region ${REGION}`);
  console.log(`   aws s3 rm s3://${bucketName} --recursive && aws s3 rb s3://${bucketName}`);
}

// Handle cleanup on Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Deployment interrupted by user');
  process.exit(1);
});

deployWithCloudFormation().catch(console.error);