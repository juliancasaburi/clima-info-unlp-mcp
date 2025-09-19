#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Role, ServicePrincipal, ManagedPolicy } from "aws-cdk-lib/aws-iam";
import {
  RestApi,
  LambdaIntegration,
  AuthorizationType,
  Cors,
} from "aws-cdk-lib/aws-apigateway";
import { AwsSolutionsChecks, NagSuppressions } from "cdk-nag";
import * as path from "path";
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ClimaInfoMcpAwsLabsStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    stackNameSuffix: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // Create IAM role for Lambda function
    const lambdaRole = new Role(this, 'ClimaInfoMcpLambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Suppress CDK NAG warnings for IAM managed policies
    NagSuppressions.addResourceSuppressions(lambdaRole, [
      {
        id: "AwsSolutions-IAM4",
        reason: "Using AWS managed policy for basic Lambda execution role as recommended by AWS",
        appliesTo: ['Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
      },
    ]);

    const logGroup = new LogGroup(this, "LogGroup", {
      logGroupName: "mcp-server-clima-info-unlp" + stackNameSuffix,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaFunction = new NodejsFunction(this, "function", {
      functionName: "mcp-server-clima-info-unlp" + stackNameSuffix,
      role: lambdaRole,
      logGroup,
      memorySize: 512,
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "src", "lambda-api-gateway.ts"),
      environment: {
        LOG_LEVEL: "DEBUG",
      },
      bundling: {
        format: OutputFormat.ESM,
        mainFields: ["module", "main"],
        nodeModules: ["@modelcontextprotocol/sdk", "@aws/run-mcp-servers-with-aws-lambda", "zod"],
        minify: true,
        sourceMap: false,
        // Copy additional files needed by the subprocess handler
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [];
          },
          beforeInstall(inputDir: string, outputDir: string): string[] {
            return [];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            // Use cross-platform commands
            const isWindows = process.platform === 'win32';
            const copyCmd = isWindows ? 'copy' : 'cp';
            const pathSep = isWindows ? '\\' : '/';
            
            return [
              `${copyCmd} "${inputDir}${pathSep}build${pathSep}index-lambda-subprocess.js" "${outputDir}${pathSep}index-lambda-subprocess.js"`,
              `${copyCmd} "${inputDir}${pathSep}build${pathSep}weather-core.js" "${outputDir}${pathSep}weather-core.js"`,
            ];
          },
        },
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Create API Gateway with no authentication
    this.createApiGateway(lambdaFunction, stackNameSuffix);
  }

  private createApiGateway(
    lambdaFunction: NodejsFunction,
    stackNameSuffix: string
  ) {
    // Create Lambda integration
    const lambdaIntegration = new LambdaIntegration(lambdaFunction);

    // Create API Gateway with no authentication
    const api = new RestApi(this, "ClimaInfoMcpApiGateway", {
      restApiName: `MCP Clima Info UNLP API Gateway ${stackNameSuffix}`,
      description:
        "API Gateway for MCP Clima Info UNLP server with no authentication",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ['*'],
      },
      deployOptions: {
        stageName: "prod",
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      deploy: true,
      cloudWatchRole: false,
    });

    // Add mcp endpoint with no authentication
    const mcpResource = api.root.addResource("mcp");
    const mcpMethod = mcpResource.addMethod("ANY", lambdaIntegration, {
      authorizationType: AuthorizationType.NONE,
    });

    // Suppress CDK NAG warnings for no authentication (intentional design choice)
    NagSuppressions.addResourceSuppressions(mcpMethod, [
      {
        id: "AwsSolutions-APIG4",
        reason: "No authentication required by design - this is a public weather API",
      },
      {
        id: "AwsSolutions-COG4", 
        reason: "Cognito user pool not required - this is a public weather API with no authentication",
      },
    ]);

    // Add CDK NAG suppressions
    NagSuppressions.addResourceSuppressions(api, [
      {
        id: "AwsSolutions-APIG2",
        reason:
          "Request validation is handled by the MCP SDK in the Lambda functions",
      },
    ]);

    NagSuppressions.addResourceSuppressions(api.deploymentStage, [
      {
        id: "AwsSolutions-APIG1",
        reason: "Per-API Access logging is not enabled for this example",
      },
      {
        id: "AwsSolutions-APIG3",
        reason: "WAF is not enabled for this example",
      },
      {
        id: "AwsSolutions-APIG6",
        reason: "Per-API CloudWatch logging is not enabled for this example",
      },
    ]);

    // Outputs
    new cdk.CfnOutput(this, "McpServerUrl", {
      value: `${api.url}mcp`,
      description: "Clima Info UNLP MCP API Gateway URL",
      exportName: `ClimaInfoMcpServerUrl${stackNameSuffix}`,
    });

    new cdk.CfnOutput(this, "ApiGatewayId", {
      value: api.restApiId,
      description: "API Gateway ID",
    });
  }
}

// Create the CDK app
const app = new cdk.App();
const stackNameSuffix =
  "INTEG_TEST_ID" in process.env ? `-${process.env["INTEG_TEST_ID"]}` : "";
const stack = new ClimaInfoMcpAwsLabsStack(
  app,
  "clima-info-unlp-mcp",
  stackNameSuffix,
  {
    env: { account: process.env["CDK_DEFAULT_ACCOUNT"], region: "us-east-1" },
    stackName: "clima-info-unlp-mcp" + stackNameSuffix,
  }
);
cdk.Aspects.of(stack).add(new AwsSolutionsChecks({ verbose: true }));
app.synth();