# Environment Configuration Guide

This guide provides standardized patterns for configuring different testing environments in enterprise applications.

## Configuration Structure

Each environment should have a dedicated configuration approach following these principles:

1. Environment variables for runtime configuration
2. Configuration files for static settings
3. Secret management for sensitive information
4. Feature flags for behavior control

## Environment Variable Files

### Structure

Each project should implement the following `.env` file structure:

```
project/
├── .env                 # Default development values, gitignored
├── .env.example         # Template with keys but no values, committed to git
├── .env.dev             # Development environment values, gitignored
├── .env.int             # Integration environment values, gitignored
├── .env.stg             # Staging environment values, gitignored
├── .env.prod            # Production environment values, gitignored
└── .env.test            # Test-specific overrides, committed to git
```

### Variable Naming Conventions

Use consistent naming patterns for environment variables:

```
# General format
[PREFIX]_[CATEGORY]_[VARIABLE_NAME]

# Examples
APP_NAME=Enterprise Application
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=app_user
DB_PASSWORD=password  # Use secrets management in non-DEV environments
DB_NAME=app_database

# API configuration
API_URL=https://api.example.com
API_VERSION=v1
API_TIMEOUT_MS=5000
API_RATE_LIMIT=100

# Authentication
AUTH_PROVIDER=oauth
AUTH_CLIENT_ID=client_id
AUTH_CLIENT_SECRET=client_secret  # Use secrets management in non-DEV environments
AUTH_CALLBACK_URL=http://localhost:3000/auth/callback

# Feature flags
FEATURE_NEW_UI=true
FEATURE_BETA_API=false
```

### Environment-Specific Variables

Define environment-specific variables using consistent patterns:

#### Development (.env.dev)

```
NODE_ENV=development
LOG_LEVEL=debug
API_URL=http://localhost:8080/api
DB_HOST=localhost
FEATURE_NEW_UI=true
FEATURE_BETA_API=true
ERROR_REPORTING=false
```

#### Integration (.env.int)

```
NODE_ENV=integration
LOG_LEVEL=info
API_URL=https://int-api.enterprise.com
DB_HOST=int-db.enterprise.internal
FEATURE_NEW_UI=true
FEATURE_BETA_API=true
ERROR_REPORTING=true
```

#### Staging (.env.stg)

```
NODE_ENV=staging
LOG_LEVEL=warn
API_URL=https://stg-api.enterprise.com
DB_HOST=stg-db.enterprise.internal
FEATURE_NEW_UI=true
FEATURE_BETA_API=false
ERROR_REPORTING=true
```

#### Production (.env.prod)

```
NODE_ENV=production
LOG_LEVEL=error
API_URL=https://api.enterprise.com
DB_HOST=prod-db.enterprise.internal
FEATURE_NEW_UI=false
FEATURE_BETA_API=false
ERROR_REPORTING=true
```

## Configuration Loading

### Node.js Configuration Loading

Use a standardized configuration loader that supports environment-specific overrides:

```typescript
// config.ts
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

export function loadConfig(environment = process.env.NODE_ENV) {
  // Set default environment if not specified
  const env = environment || "development";

  // Define environment file paths
  const defaultEnvPath = path.resolve(process.cwd(), ".env");
  const envPath = path.resolve(process.cwd(), `.env.${env}`);
  const localEnvPath = path.resolve(process.cwd(), `.env.${env}.local`);

  // Load environment files with cascading priority
  if (fs.existsSync(defaultEnvPath)) {
    dotenv.config({ path: defaultEnvPath });
  }

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }

  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath, override: true });
  }

  // Build and validate configuration
  const config = {
    app: {
      name: process.env.APP_NAME || "Enterprise App",
      environment: env,
      logLevel: process.env.LOG_LEVEL || "info",
    },
    database: {
      host: requireEnv("DB_HOST"),
      port: parseInt(process.env.DB_PORT || "5432", 10),
      user: requireEnv("DB_USER"),
      password: requireEnv("DB_PASSWORD"),
      database: requireEnv("DB_NAME"),
      ssl: env !== "development",
    },
    api: {
      url: requireEnv("API_URL"),
      version: process.env.API_VERSION || "v1",
      timeout: parseInt(process.env.API_TIMEOUT_MS || "5000", 10),
      rateLimit: parseInt(process.env.API_RATE_LIMIT || "100", 10),
    },
    features: {
      newUi: process.env.FEATURE_NEW_UI === "true",
      betaApi: process.env.FEATURE_BETA_API === "true",
    },
    monitoring: {
      errorReporting: process.env.ERROR_REPORTING === "true",
      performanceMonitoring: process.env.PERFORMANCE_MONITORING === "true",
    },
  };

  // Validate required configuration is present
  validateConfig(config);

  return config;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is missing`);
  }
  return value;
}

function validateConfig(config: any) {
  // Add validation logic specific to your application requirements
}
```

## Secrets Management

### Secrets in Different Environments

Different environments should use different approaches to secrets management:

- **DEV**: Local `.env` files (not committed to git)
- **INT/STG/PROD**: Vault, AWS Secrets Manager, or other enterprise secrets solution

```typescript
// secrets.ts
import { SecretsManager } from "aws-sdk";

export async function getSecret(secretName: string): Promise<string> {
  const environment = process.env.NODE_ENV || "development";

  // In development, use local environment variables
  if (environment === "development" || environment === "test") {
    const value = process.env[secretName];
    if (!value) {
      throw new Error(
        `Secret ${secretName} not found in environment variables`
      );
    }
    return value;
  }

  // In other environments, use AWS Secrets Manager
  try {
    const secretsManager = new SecretsManager({
      region: process.env.AWS_REGION || "us-east-1",
    });

    const secretPath = `${environment}/app/${secretName}`;
    const response = await secretsManager
      .getSecretValue({ SecretId: secretPath })
      .promise();

    if ("SecretString" in response) {
      return response.SecretString as string;
    } else {
      // Handle binary secret (uncommon for most use cases)
      return Buffer.from(response.SecretBinary as Buffer).toString("ascii");
    }
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    throw new Error(`Failed to retrieve secret ${secretName}`);
  }
}
```

## Feature Flags

Use a consistent feature flag implementation across environments:

```typescript
// features.ts
import { loadConfig } from "./config";

export class FeatureFlags {
  private static instance: FeatureFlags;
  private config: any;

  private constructor() {
    this.config = loadConfig();
  }

  public static getInstance(): FeatureFlags {
    if (!FeatureFlags.instance) {
      FeatureFlags.instance = new FeatureFlags();
    }
    return FeatureFlags.instance;
  }

  public isEnabled(featureName: string): boolean {
    if (!this.config.features) {
      return false;
    }

    return !!this.config.features[featureName];
  }

  public getVariant(
    featureName: string,
    defaultVariant: string = "default"
  ): string {
    if (
      !this.config.features ||
      !this.config.features[`${featureName}_variant`]
    ) {
      return defaultVariant;
    }

    return this.config.features[`${featureName}_variant`];
  }
}

// Usage example
const features = FeatureFlags.getInstance();
if (features.isEnabled("newUi")) {
  // Render new UI components
}
```

## Configuration Validation

Implement configuration validation to catch errors early:

```typescript
// validation.ts
import Joi from "joi";

export function validateDatabaseConfig(config: any) {
  const schema = Joi.object({
    host: Joi.string().required(),
    port: Joi.number().port().required(),
    user: Joi.string().required(),
    password: Joi.string().required(),
    database: Joi.string().required(),
    ssl: Joi.boolean().default(false),
  });

  const { error, value } = schema.validate(config);
  if (error) {
    throw new Error(`Invalid database configuration: ${error.message}`);
  }

  return value;
}

// Add other validation functions for different config sections
```

## Environment Detection

Add reliable environment detection utilities:

```typescript
// environment.ts
export enum Environment {
  Development = "development",
  Test = "test",
  Integration = "integration",
  Staging = "staging",
  Production = "production",
}

export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV || "development";

  switch (env) {
    case "development":
      return Environment.Development;
    case "test":
      return Environment.Test;
    case "integration":
    case "int":
      return Environment.Integration;
    case "staging":
    case "stg":
      return Environment.Staging;
    case "production":
    case "prod":
      return Environment.Production;
    default:
      console.warn(`Unknown environment: ${env}, defaulting to Development`);
      return Environment.Development;
  }
}

export function isDevelopment(): boolean {
  return getCurrentEnvironment() === Environment.Development;
}

export function isTest(): boolean {
  return getCurrentEnvironment() === Environment.Test;
}

export function isIntegration(): boolean {
  return getCurrentEnvironment() === Environment.Integration;
}

export function isStaging(): boolean {
  return getCurrentEnvironment() === Environment.Staging;
}

export function isProduction(): boolean {
  return getCurrentEnvironment() === Environment.Production;
}
```

## Frontend Environment Configuration

For web applications, use environment-specific configuration for the frontend:

### React Example

```typescript
// src/config/environment.ts
export const API_URL = process.env.REACT_APP_API_URL!;
export const AUTH_DOMAIN = process.env.REACT_APP_AUTH_DOMAIN!;
export const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT || "development";

export const isProduction = ENVIRONMENT === "production";
export const isStaging = ENVIRONMENT === "staging";
export const isDevelopment = ENVIRONMENT === "development";
export const isIntegration = ENVIRONMENT === "integration";

// Feature flags
export const FEATURES = {
  newUi: process.env.REACT_APP_FEATURE_NEW_UI === "true",
  betaApi: process.env.REACT_APP_FEATURE_BETA_API === "true",
};
```

With corresponding `.env.development`, `.env.production`, etc. files:

```
# .env.development
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_AUTH_DOMAIN=dev-auth.example.com
REACT_APP_ENVIRONMENT=development
REACT_APP_FEATURE_NEW_UI=true
REACT_APP_FEATURE_BETA_API=true
```

## Service-Specific Configuration

For services with specific requirements, create dedicated configuration sections:

```typescript
// Database-specific configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  ssl: boolean;
}

// Cache-specific configuration
export interface CacheConfig {
  provider: "redis" | "memory";
  host?: string;
  port?: number;
  ttl: number;
  keyPrefix: string;
}

// Message queue configuration
export interface MessageQueueConfig {
  provider: "rabbitmq" | "sqs";
  url: string;
  exchangeName?: string;
  queueName: string;
  visibilityTimeout?: number;
}
```

## Tooling for Configuration Management

Implement scripts to help with environment configuration management:

```json
{
  "scripts": {
    "config:validate": "ts-node scripts/validate-config.ts",
    "config:generate": "ts-node scripts/generate-env-template.ts",
    "config:diff": "ts-node scripts/diff-env-files.ts",
    "config:secrets:rotate": "ts-node scripts/rotate-secrets.ts"
  }
}
```
