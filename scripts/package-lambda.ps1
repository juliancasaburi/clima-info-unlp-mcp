# Lambda ZIP packaging script for PowerShell
# Creates a deployment-ready ZIP file for AWS Lambda

param(
    [string]$OutputDir = "dist"
)

Write-Host "📦 Starting Lambda ZIP packaging..." -ForegroundColor Green

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $ProjectRoot $OutputDir
$PackageDir = Join-Path $DistDir "lambda-package"
$ZipPath = Join-Path $DistDir "clima-info-unlp-mcp-lambda.zip"

# Clean and create dist directory
if (Test-Path $DistDir) {
    Remove-Item $DistDir -Recurse -Force
}
New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
New-Item -ItemType Directory -Path $PackageDir -Force | Out-Null

Write-Host "🔨 Installing production dependencies..." -ForegroundColor Yellow

# Create a minimal package.json for Lambda
$LambdaPackageJson = @"
{
  "name": "clima-info-unlp-mcp-lambda",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "zod": "^3.23.8"
  }
}
"@

# Write package.json to staging directory
$PackageJsonPath = Join-Path $PackageDir "package.json"
$LambdaPackageJson | Out-File -FilePath $PackageJsonPath -Encoding UTF8

# Install dependencies in staging directory
Write-Host "   Installing dependencies..." -ForegroundColor Gray
Push-Location $PackageDir
try {
    npm install --production
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
}
finally {
    Pop-Location
}

# Copy built JavaScript files
Write-Host "📁 Copying built files..." -ForegroundColor Yellow
$FilesToCopy = @(
    "lambda.js",
    "lambda.js.map", 
    "weather-core.js",
    "weather-core.js.map"
)

$BuildDir = Join-Path $ProjectRoot "build"
foreach ($File in $FilesToCopy) {
    $SrcPath = Join-Path $BuildDir $File
    $DestPath = Join-Path $PackageDir $File
    
    if (Test-Path $SrcPath) {
        Copy-Item $SrcPath $DestPath
        Write-Host "   ✓ Copied $File" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  File not found: $File" -ForegroundColor Yellow
    }
}

# Rename lambda.js to index.js for Lambda entry point
$LambdaPath = Join-Path $PackageDir "lambda.js"
$IndexPath = Join-Path $PackageDir "index.js"
if (Test-Path $LambdaPath) {
    Rename-Item $LambdaPath "index.js"
    Write-Host "   ✓ Renamed lambda.js to index.js" -ForegroundColor Green
}

# Also rename the map file
$LambdaMapPath = Join-Path $PackageDir "lambda.js.map"
$IndexMapPath = Join-Path $PackageDir "index.js.map"
if (Test-Path $LambdaMapPath) {
    Rename-Item $LambdaMapPath "index.js.map"
    Write-Host "   ✓ Renamed lambda.js.map to index.js.map" -ForegroundColor Green
}

# Create the ZIP file
Write-Host "🗜️  Creating ZIP archive..." -ForegroundColor Yellow

# Remove existing zip if it exists
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

# Create ZIP using .NET compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($PackageDir, $ZipPath)

# Get file size
$ZipFile = Get-Item $ZipPath
$SizeInMB = [math]::Round($ZipFile.Length / 1MB, 2)

Write-Host ""
Write-Host "✅ Lambda ZIP package created successfully!" -ForegroundColor Green
Write-Host "📁 Location: $ZipPath" -ForegroundColor Cyan
Write-Host "📊 Size: $SizeInMB MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload the ZIP file to AWS Lambda"
Write-Host "2. Set the handler to: index.handler"
Write-Host "3. Set the runtime to: Node.js 18.x"
Write-Host "4. Configure environment variables if needed"
Write-Host ""
Write-Host "💡 Or use AWS CLI:" -ForegroundColor Yellow
Write-Host "aws lambda create-function \"
Write-Host "  --function-name clima-info-unlp-mcp \"
Write-Host "  --runtime nodejs18.x \"
Write-Host "  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \"
Write-Host "  --handler index.handler \"
Write-Host "  --zip-file fileb://$ZipPath"