const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

async function createPackage() {
  const PACKAGE_NAME = 'clima-info-unlp-mcp-api-gateway.zip';
  const BUILD_DIR = path.join(__dirname, '..', 'build');
  const DIST_DIR = path.join(__dirname, '..', 'dist');
  const PACKAGE_DIR = path.join(DIST_DIR, 'api-gateway-package');
  const ROOT_DIR = path.join(__dirname, '..');

  // Ensure directories exist
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  if (fs.existsSync(PACKAGE_DIR)) {
    fs.rmSync(PACKAGE_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PACKAGE_DIR, { recursive: true });

  console.log('🏗️  Building TypeScript sources...');
  execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });

  console.log('📦 Creating AWS Labs API Gateway MCP Lambda package...');

  // Copy built files
  console.log('📁 Copying build files...');
  const buildFiles = fs.readdirSync(BUILD_DIR);
  buildFiles.forEach(file => {
    const srcPath = path.join(BUILD_DIR, file);
    const destPath = path.join(PACKAGE_DIR, file); // Copy directly to root, not to build/ subdirectory
    
    fs.copyFileSync(srcPath, destPath);
    console.log(`   ✓ ${file}`);
  });

  // Create package.json with dependencies
  console.log('📄 Creating package.json...');
  const packageJson = {
    "name": "clima-info-unlp-mcp-api-gateway",
    "version": "1.0.0",
    "type": "module",
    "main": "index.js",
    "dependencies": {
      "@modelcontextprotocol/sdk": "^1.0.4",
      "@aws/run-mcp-servers-with-aws-lambda": "^0.4.2",
      "zod": "^3.24.1"
    }
  };

  fs.writeFileSync(
    path.join(PACKAGE_DIR, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Copy the API Gateway handler as the main entry point
  console.log('🔧 Setting up Lambda entry point...');
  const handlerSrc = path.join(BUILD_DIR, 'lambda-api-gateway.js');
  const handlerDest = path.join(PACKAGE_DIR, 'index.js');
  fs.copyFileSync(handlerSrc, handlerDest);

  // Install dependencies
  console.log('📥 Installing dependencies...');
  execSync('npm install --omit=dev --no-package-lock', { 
    cwd: PACKAGE_DIR, 
    stdio: 'inherit' 
  });

  // Create ZIP file
  console.log('🗜️  Creating ZIP package...');
  const output = fs.createWriteStream(path.join(DIST_DIR, PACKAGE_NAME));
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  archive.directory(PACKAGE_DIR, false);

  await new Promise((resolve, reject) => {
    output.on('close', resolve);
    output.on('error', reject);
    archive.finalize();
  });

  // Get package size
  const stats = fs.statSync(path.join(DIST_DIR, PACKAGE_NAME));
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`✅ AWS Labs API Gateway MCP Lambda package created: ${PACKAGE_NAME}`);
  console.log(`📊 Package size: ${sizeInMB} MB`);
  console.log(`📍 Location: ${path.join(DIST_DIR, PACKAGE_NAME)}`);
  console.log('');
  console.log('🚀 Package ready for CDK deployment!');
  console.log('💡 This package uses AWS Labs with API Gateway (no authentication).');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Install CDK dependencies: npm install aws-cdk-lib constructs cdk-nag');
  console.log('   2. Deploy with CDK: npx cdk deploy -f cdk-stack.ts');
  console.log('   3. Use the API Gateway URL for MCP client connections');
  console.log('   4. No authentication required - direct HTTP access');

  // Cleanup
  fs.rmSync(PACKAGE_DIR, { recursive: true, force: true });
}

createPackage().catch(console.error);