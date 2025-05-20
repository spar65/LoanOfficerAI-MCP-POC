# Environment Configuration Strategy

This guide outlines best practices for managing environment configurations across different deployment targets in accordance with the [Deployment Infrastructure Standards](../../departments/engineering/operations/200-deployment-infrastructure.mdc).

## Configuration Management Principles

1. **Environment Separation**: Each environment (Development, Testing, Staging, Production) must have its own isolated configuration
2. **Configuration as Code**: Environment configurations should be versioned and treated as code
3. **Least Privilege**: Only provide the minimum necessary access and credentials for each environment
4. **Configuration Consistency**: Maintain similar configuration structures across environments while varying the values
5. **Secret Management**: Sensitive configuration values must be stored securely, not in source code

## Configuration Storage Options

| Method                      | Best For                                | Security Level | Ease of Use | Example                                               |
| --------------------------- | --------------------------------------- | -------------- | ----------- | ----------------------------------------------------- |
| Environment Variables       | Local development, simple apps          | Medium         | High        | `DATABASE_URL=postgres://user:pass@localhost:5432/db` |
| Configuration Files         | Complex configurations with hierarchies | Medium-Low     | High        | `config/environments/production.json`                 |
| Secrets Management Service  | Production credentials                  | High           | Medium      | AWS Secrets Manager, HashiCorp Vault                  |
| CI/CD Platform Secrets      | Pipeline-specific credentials           | High           | Medium      | GitHub Secrets, GitLab CI Variables                   |
| Environment Management Tool | Full environment configuration          | High           | Medium      | Terraform, Pulumi                                     |

## Environment Configuration Structure

### Basic Folder Structure

```
/config
  /environments
    development.json
    testing.json
    staging.json
    production.json
  /schemas
    configuration.schema.json  # JSON schema for validation
  defaults.json  # Default values for all environments
```

### Configuration Loading Order

1. Load defaults (common values across all environments)
2. Override with environment-specific values
3. Override with secrets (loaded from external source)
4. Override with instance-specific values (if applicable)

## Environment-Specific Guidelines

### Development Environment

```json
{
  "app": {
    "name": "MyApp",
    "environment": "development",
    "debug": true,
    "logLevel": "debug"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp_dev",
    "username": "dev_user",
    "password": "${SECRET_DB_PASSWORD}" // Loaded from local .env file
  },
  "api": {
    "baseUrl": "http://localhost:3000",
    "timeout": 30000,
    "mockResponses": true
  },
  "features": {
    "newFeatureFlag": true
  }
}
```

### Testing/QA Environment

```json
{
  "app": {
    "name": "MyApp",
    "environment": "testing",
    "debug": true,
    "logLevel": "info"
  },
  "database": {
    "host": "testing-db.internal",
    "port": 5432,
    "name": "myapp_test",
    "username": "test_user",
    "password": "${SECRET_TEST_DB_PASSWORD}" // Loaded from secrets manager
  },
  "api": {
    "baseUrl": "https://api-test.example.com",
    "timeout": 30000,
    "mockResponses": false
  },
  "features": {
    "newFeatureFlag": true
  }
}
```

### Staging Environment

```json
{
  "app": {
    "name": "MyApp",
    "environment": "staging",
    "debug": false,
    "logLevel": "info"
  },
  "database": {
    "host": "staging-db.internal",
    "port": 5432,
    "name": "myapp_staging",
    "username": "staging_user",
    "password": "${SECRET_STAGING_DB_PASSWORD}" // Loaded from secrets manager
  },
  "api": {
    "baseUrl": "https://api-staging.example.com",
    "timeout": 15000,
    "mockResponses": false
  },
  "features": {
    "newFeatureFlag": true
  }
}
```

### Production Environment

```json
{
  "app": {
    "name": "MyApp",
    "environment": "production",
    "debug": false,
    "logLevel": "warn"
  },
  "database": {
    "host": "production-db.internal",
    "port": 5432,
    "name": "myapp_prod",
    "username": "prod_user",
    "password": "${SECRET_PROD_DB_PASSWORD}" // Loaded from secrets manager
  },
  "api": {
    "baseUrl": "https://api.example.com",
    "timeout": 10000,
    "mockResponses": false
  },
  "features": {
    "newFeatureFlag": false
  }
}
```

## Secret Management with GitHub Actions

```yaml
# Example GitHub Actions workflow with environment-specific secrets
name: Deploy with Environment Configuration

on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    name: Deploy to ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    runs-on: ubuntu-latest
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    steps:
      - uses: actions/checkout@v3

      - name: Set up environment
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Create environment-specific config
        run: |
          echo "Creating ${GITHUB_ENV} configuration"
          # Load the appropriate configuration file
          cp config/environments/${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}.json config/active.json

      - name: Inject secrets
        env:
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          API_KEY: ${{ secrets.API_KEY }}
          AUTH_TOKEN: ${{ secrets.AUTH_TOKEN }}
        run: |
          # Replace placeholders with actual secrets
          sed -i "s/\${SECRET_DB_PASSWORD}/$DB_PASSWORD/g" config/active.json
          sed -i "s/\${SECRET_API_KEY}/$API_KEY/g" config/active.json
          sed -i "s/\${SECRET_AUTH_TOKEN}/$AUTH_TOKEN/g" config/active.json

      - name: Build with configuration
        run: npm run build
```

## Configuration Validation

Always validate configurations:

1. **Schema Validation**: Use JSON Schema to validate structure and data types
2. **Connection Testing**: Verify database connections and API endpoints
3. **Secret Presence**: Check that all required secrets are available
4. **Consistency Check**: Ensure all environments have the same configuration structure

Example validation script:

```javascript
// validate-config.js
const Ajv = require("ajv");
const fs = require("fs");
const path = require("path");

// Load the schema
const schema = require("./config/schemas/configuration.schema.json");
const ajv = new Ajv();
const validate = ajv.compile(schema);

// Validate all environment configs
const environments = ["development", "testing", "staging", "production"];
let hasErrors = false;

environments.forEach((env) => {
  const configPath = path.join(__dirname, `config/environments/${env}.json`);
  const config = require(configPath);

  const valid = validate(config);
  if (!valid) {
    console.error(`❌ ${env} configuration is invalid:`);
    console.error(validate.errors);
    hasErrors = true;
  } else {
    console.log(`✅ ${env} configuration is valid`);
  }
});

if (hasErrors) {
  process.exit(1);
}
```

## Environment Parity Considerations

1. **Infrastructure**: Use Infrastructure as Code to ensure environment similarity
2. **Dependencies**: Use the same dependency versions across environments
3. **Data**: Use anonymized production data in lower environments when possible
4. **Services**: Ensure the same external services are available in all environments

## Feature Flags and Environment-Specific Behavior

Use feature flags to control environment-specific behavior:

```javascript
// Example feature flag usage
if (config.features.newFeatureFlag) {
  // Enable new feature
  app.use("/new-feature", newFeatureRouter);
}
```

Feature flags should be easily togglable per environment.

## Common Pitfalls to Avoid

1. ❌ Hardcoding environment-specific values
2. ❌ Storing sensitive information in version control
3. ❌ Using different configuration structures across environments
4. ❌ Testing with mocks but deploying to real services without integration testing
5. ❌ Manual configuration changes in production

## Implementation Checklist

- [ ] Configuration storage strategy defined
- [ ] Secret management solution implemented
- [ ] Configuration schema created
- [ ] Configuration validation implemented
- [ ] Environment-specific configurations created
- [ ] Configuration loading in application code
- [ ] Documentation for configuration change process
