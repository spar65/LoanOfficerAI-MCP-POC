# Testing Environments Architecture

This guide provides a detailed architecture overview for implementing standardized testing environments across the enterprise.

## Environment Structure Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Deployment Pipeline                           │
└───────────┬─────────────┬─────────────┬─────────────┬───────────────┘
            │             │             │             │
            ▼             ▼             ▼             ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│      DEV      │ │      INT      │ │      STG      │ │     PROD      │
│               │ │               │ │               │ │               │
│ • Unit Tests  │ │ • Int. Tests  │ │ • E2E Tests   │ │ • Smoke Tests │
│ • SAST        │ │ • E2E Tests   │ │ • Perf Tests  │ │ • Monitoring  │
│ • Local Dev   │ │ • DAST        │ │ • Pen Tests   │ │ • Alerts      │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │                 │
┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
│  DEV Data     │ │  INT Data     │ │  STG Data     │ │  PROD Data    │
│  • Synthetic  │ │  • Synthetic  │ │  • Anonymized │ │  • Real Data  │
│  • Reset      │ │  • Snapshot   │ │  • Subset     │ │  • Protected  │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
```

## Environment Specifications

### Development (DEV)

The development environment is designed for rapid iteration and development.

**Infrastructure:**

- Local developers' machines or ephemeral cloud environments
- Containerized dependencies (Docker/Kubernetes)
- Minimal resource allocation
- Fast startup/teardown

**Configuration:**

- `.env.dev` and `.env.test` files
- Debug-level logging
- Mock external dependencies where appropriate
- Development feature flags enabled

**Testing Scope:**

- Unit tests
- Component tests
- Limited integration tests
- Static code analysis (SAST)
- Code quality checks

**Data Management:**

- Fully synthetic data
- Automatic data reset between test runs
- In-memory databases for faster tests
- Fixed test data patterns

### Integration/QA (INT)

The integration environment is for testing feature integration and system-level validation.

**Infrastructure:**

- Dedicated cloud environment
- Shared resources for team access
- Medium resource allocation
- Daily refresh/reset capability

**Configuration:**

- `.env.int` files
- Info-level logging
- Limited external dependency mocking
- Configurable feature flags

**Testing Scope:**

- Integration tests
- API contract tests
- Basic E2E tests
- Dynamic security scanning (DAST)
- Compliance validation

**Data Management:**

- Synthetic data with realistic patterns
- Scheduled data refresh
- Persistent databases with test data snapshots
- Data generators for specific test scenarios

### Staging (STG)

The staging environment is a production-like environment for final validation.

**Infrastructure:**

- Mirror of production architecture
- Isolated but equivalent cloud services
- Production-comparable resource allocation
- Blue/green deployment capability

**Configuration:**

- `.env.stg` files
- Production-like logging levels
- Real external dependencies (sandboxed)
- Feature flags matching upcoming production release

**Testing Scope:**

- Full E2E test suites
- Performance/load testing
- Penetration testing
- User acceptance testing (UAT)
- Disaster recovery testing

**Data Management:**

- Anonymized subset of production data
- Protected data access controls
- Realistic data volumes and patterns
- Regular data refresh from anonymized production snapshots

### Production (PROD)

The production environment hosts live systems with real user traffic.

**Infrastructure:**

- Full production architecture with redundancy
- High-availability configuration
- Auto-scaling resources
- Multiple geographic regions where required

**Configuration:**

- `.env.prod` files
- Minimal logging (warning/error level)
- Real external dependencies
- Controlled feature flag rollouts

**Testing Scope:**

- Smoke tests after deployment
- Synthetic monitoring
- Real-user monitoring
- Automated alerts
- Canary testing for gradual rollouts

**Data Management:**

- Real production data
- Highest security controls
- Regular backups
- Data retention policies enforcement

## Environment Promotion Flow

Code changes follow a structured promotion path from development to production:

1. **Development (DEV)**

   - Developers commit code to feature branches
   - CI pipeline runs unit and basic integration tests
   - Code review and approval process

2. **Integration (INT)**

   - Merged features are deployed to INT
   - Automated integration tests verify system behavior
   - QA team performs exploratory testing
   - Security scanning validates no new vulnerabilities

3. **Staging (STG)**

   - Release candidates are deployed to staging
   - Full regression test suite execution
   - Performance testing validates system under load
   - Final UAT and stakeholder approval

4. **Production (PROD)**
   - Approved release is deployed via blue/green or canary process
   - Smoke tests verify critical paths
   - Monitoring confirms system health
   - Progressive feature flag enablement for controlled rollout

## Infrastructure as Code

All environments should be defined using Infrastructure as Code (IaC) tools:

```terraform
# Example Terraform configuration for environment
module "environment" {
  source = "./modules/environment"

  name        = var.environment_name  # "dev", "int", "stg", or "prod"
  region      = var.aws_region
  vpc_id      = var.vpc_id

  # Environment-specific configuration
  instance_size = lookup({
    "dev" = "t3.medium",
    "int" = "t3.large",
    "stg" = "m5.xlarge",
    "prod" = "m5.2xlarge"
  }, var.environment_name)

  auto_scaling = lookup({
    "dev" = false,
    "int" = false,
    "stg" = true,
    "prod" = true
  }, var.environment_name)

  multi_az = lookup({
    "dev" = false,
    "int" = false,
    "stg" = true,
    "prod" = true
  }, var.environment_name)

  # Security configuration based on environment
  security_level = lookup({
    "dev" = "standard",
    "int" = "enhanced",
    "stg" = "high",
    "prod" = "maximum"
  }, var.environment_name)

  # Database configuration
  database = {
    instance_type = lookup({
      "dev" = "db.t3.small",
      "int" = "db.t3.medium",
      "stg" = "db.m5.large",
      "prod" = "db.m5.2xlarge"
    }, var.environment_name)

    encryption = lookup({
      "dev" = false,
      "int" = true,
      "stg" = true,
      "prod" = true
    }, var.environment_name)
  }
}
```

## Environment-Specific Testing Scripts

Configure package.json to include environment-specific testing scripts:

```json
{
  "scripts": {
    "test:unit": "jest",
    "test:integration": "jest --config=jest.integration.config.js",
    "test:e2e": "cypress run",
    "test:e2e:full": "cypress run --config-file cypress.full.config.js",
    "test:security": "npm run security:sast && npm run security:dast",
    "test:security:full": "npm run security:sast && npm run security:dast && npm run security:pentest",
    "test:performance": "k6 run performance/load-test.js",
    "test:smoke": "jest --config=jest.smoke.config.js",

    "test:dev": "cross-env TEST_ENV=dev npm run test:unit && npm run test:integration",
    "test:int": "cross-env TEST_ENV=int npm run test:integration && npm run test:e2e && npm run test:security",
    "test:stg": "cross-env TEST_ENV=stg npm run test:e2e:full && npm run test:performance && npm run test:security:full",
    "test:prod": "cross-env TEST_ENV=prod npm run test:smoke"
  }
}
```

## Monitoring and Observability

Each environment should have appropriate monitoring with escalating levels of alerting:

- **DEV**: Logs visible in developer console, no active alerts
- **INT**: Logs and basic metrics in monitoring system, alerts to development team
- **STG**: Full monitoring stack, alerts to QA and development teams
- **PROD**: Comprehensive monitoring, alerts to operations team with on-call rotation

## Security Controls by Environment

Security measures become progressively stricter with each environment:

| Security Control  | DEV                  | INT           | STG                | PROD                         |
| ----------------- | -------------------- | ------------- | ------------------ | ---------------------------- |
| Access Control    | Individual developer | Team-based    | Role-based         | Principle of least privilege |
| Authentication    | Simple/mock          | OAuth         | MFA                | MFA + IP restrictions        |
| Data Protection   | Basic                | Encrypted     | Encrypted + Masked | Encrypted + Masked + Audited |
| Network Security  | Open internal        | VPC isolation | WAF                | WAF + DDoS protection        |
| Secret Management | Local files          | Vault (dev)   | Vault (prod)       | Vault (prod) + Rotation      |
| Compliance        | None                 | Basic checks  | Full compliance    | Full compliance + Auditing   |

## Integration with CI/CD Systems

The testing environment architecture integrates with popular CI/CD systems:

- **GitHub Actions**
- **Jenkins**
- **GitLab CI**
- **Azure DevOps**
- **CircleCI**

Example GitHub Actions workflow:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  dev_tests:
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install dependencies
        run: npm ci
      - name: Run DEV tests
        run: npm run test:dev
        env:
          NODE_ENV: development

  int_tests:
    needs: dev_tests
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: int
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install dependencies
        run: npm ci
      - name: Run INT tests
        run: npm run test:int
        env:
          NODE_ENV: integration

  stg_tests:
    needs: int_tests
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: stg
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install dependencies
        run: npm ci
      - name: Run STG tests
        run: npm run test:stg
        env:
          NODE_ENV: staging

  deploy_prod:
    needs: stg_tests
    runs-on: ubuntu-latest
    environment: prod
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: ./deploy.sh
      - name: Run smoke tests
        run: npm run test:prod
        env:
          NODE_ENV: production
```
