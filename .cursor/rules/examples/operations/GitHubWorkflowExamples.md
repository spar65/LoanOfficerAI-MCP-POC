# GitHub Workflow Examples

This document provides examples of GitHub Actions workflows that implement the principles outlined in the [Deployment Infrastructure Standards](../../departments/engineering/operations/200-deployment-infrastructure.mdc).

## Table of Contents

1. [Basic CI/CD Pipeline](#basic-cicd-pipeline)
2. [Environment-Specific Deployments](#environment-specific-deployments)
3. [Feature Branch Deployments](#feature-branch-deployments)
4. [Artifact Management](#artifact-management)
5. [Database Migration Workflows](#database-migration-workflows)
6. [Security Scanning](#security-scanning)
7. [Deployment Approval Gates](#deployment-approval-gates)
8. [Rollback Workflows](#rollback-workflows)
9. [Canary Deployments](#canary-deployments)

## Basic CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    name: Validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint code
        run: npm run lint

      - name: Format check
        run: npm run format:check

  test:
    name: Test
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

  build:
    name: Build
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: build-artifact
          path: build/
          retention-days: 30
```

## Environment-Specific Deployments

```yaml
# .github/workflows/deploy.yml
name: Deploy Application

on:
  push:
    branches:
      - develop # Auto-deploy to staging
      - main # Auto-deploy to production

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # ... (build steps from previous example) ...

      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: build-artifact
          path: build/

  deploy-staging:
    name: Deploy to Staging
    if: github.ref == 'refs/heads/develop'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build-artifact
          path: build/

      - name: Deploy to staging
        uses: some-deployment-action@v1
        with:
          environment: staging
          api_token: ${{ secrets.DEPLOY_TOKEN }}

      - name: Run smoke tests
        run: |
          npx playwright test --project=smoke

      - name: Notify team
        if: success()
        uses: some-notification-action@v1
        with:
          message: "✅ Staging deployment successful"

  deploy-production:
    name: Deploy to Production
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build-artifact
          path: build/

      # Manual approval is configured in GitHub environment settings

      - name: Deploy to production
        uses: some-deployment-action@v1
        with:
          environment: production
          api_token: ${{ secrets.DEPLOY_TOKEN }}

      - name: Verify deployment
        run: |
          curl -f https://example.com/health || exit 1

      - name: Create release tag
        run: |
          git tag "release-$(date +'%Y.%m.%d-%H%M')"
          git push --tags
```

## Feature Branch Deployments

```yaml
# .github/workflows/preview.yml
name: Preview Environment

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    environment:
      name: pr-${{ github.event.pull_request.number }}
      url: https://pr-${{ github.event.pull_request.number }}.preview.example.com
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Deploy preview environment
        uses: some-preview-deployment-action@v1
        with:
          pr_number: ${{ github.event.pull_request.number }}
          api_token: ${{ secrets.PREVIEW_DEPLOY_TOKEN }}

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview environment deployed to https://pr-${{ github.event.pull_request.number }}.preview.example.com'
            })
```

## Artifact Management

```yaml
# .github/workflows/artifacts.yml
name: Artifact Management

on:
  release:
    types: [created]
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to build for"
        required: true
        default: "staging"
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  build:
    name: Build and Store Artifact
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Set version
        id: set-version
        run: |
          if [[ "${{ github.event_name }}" == "release" ]]; then
            VERSION="${{ github.event.release.tag_name }}"
          else
            VERSION="${{ github.event.inputs.environment }}-$(date +'%Y.%m.%d-%H%M')"
          fi
          echo "VERSION=$VERSION" >> $GITHUB_ENV
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Build application
        run: |
          npm run build
          echo "VERSION=${{ env.VERSION }}" > build/VERSION

      - name: Upload to GitHub Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: app-${{ steps.set-version.outputs.version }}
          path: build/
          retention-days: 90

      - name: Push to artifact registry
        if: github.event_name == 'release'
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            mycompany/myapp:${{ steps.set-version.outputs.version }}
            mycompany/myapp:latest
```

## Database Migration Workflows

```yaml
# .github/workflows/database-migrations.yml
name: Database Migrations

on:
  push:
    branches: [main, develop]
    paths:
      - "migrations/**"
  workflow_dispatch:
    inputs:
      environment:
        description: "Target environment"
        required: true
        default: "staging"

jobs:
  validate-migrations:
    name: Validate Migrations
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_USER: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Test migrations
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_db
        run: |
          # Run migrations up
          npx knex migrate:latest

          # Verify database state
          npx knex migrate:status

          # Test migrations down (rollback)
          npx knex migrate:rollback --all

          # Verify clean state
          npx knex migrate:status

  deploy-migrations:
    name: Deploy Migrations
    needs: validate-migrations
    runs-on: ubuntu-latest
    if: ${{ github.event_name == 'workflow_dispatch' || github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop' }}
    environment:
      name: ${{ github.event.inputs.environment || (github.ref == 'refs/heads/main' && 'production' || 'staging') }}
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Set environment variables
        id: set-env
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            ENVIRONMENT="${{ github.event.inputs.environment }}"
          elif [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            ENVIRONMENT="production"
          else
            ENVIRONMENT="staging"
          fi
          echo "ENVIRONMENT=$ENVIRONMENT" >> $GITHUB_ENV

      - name: Create database backup
        env:
          DB_HOST: ${{ secrets[format('{0}_DB_HOST', env.ENVIRONMENT)] }}
          DB_USER: ${{ secrets[format('{0}_DB_USER', env.ENVIRONMENT)] }}
          DB_PASS: ${{ secrets[format('{0}_DB_PASS', env.ENVIRONMENT)] }}
          DB_NAME: ${{ secrets[format('{0}_DB_NAME', env.ENVIRONMENT)] }}
        run: |
          # Create backup before migrations
          pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -f backup.sql

      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets[format('{0}_DATABASE_URL', env.ENVIRONMENT)] }}
        run: |
          # Apply migrations
          npx knex migrate:latest

      - name: Verify migrations
        env:
          DATABASE_URL: ${{ secrets[format('{0}_DATABASE_URL', env.ENVIRONMENT)] }}
        run: |
          # Check migration status
          npx knex migrate:status

      - name: Upload backup artifact
        uses: actions/upload-artifact@v3
        with:
          name: ${{ env.ENVIRONMENT }}-db-backup-${{ github.sha }}
          path: backup.sql
          retention-days: 30
```

## Security Scanning

```yaml
# .github/workflows/security.yml
name: Security Scanning

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: "0 2 * * 1" # Weekly on Mondays at 2:00 AM

jobs:
  dependency-scan:
    name: Dependency Scanning
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true

      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: "MyApp"
          path: "."
          format: "HTML"
          args: >
            --failOnCVSS 7
            --enableRetired

      - name: Upload dependency check report
        uses: actions/upload-artifact@v3
        with:
          name: dependency-check-report
          path: reports/

  code-scanning:
    name: Code Scanning
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

  container-scanning:
    name: Container Scanning
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build container image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: "myapp:${{ github.sha }}"
          format: "sarif"
          output: "trivy-results.sarif"
          severity: "CRITICAL,HIGH"

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: "trivy-results.sarif"
```

## Deployment Approval Gates

```yaml
# .github/workflows/approval-gates.yml
name: Production Deployment with Approvals

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # ... build and test steps ...

      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: build-artifact
          path: build/

  deploy-staging:
    name: Deploy to Staging
    needs: build-and-test
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build-artifact
          path: build/

      - name: Deploy to staging
        uses: some-deployment-action@v1
        with:
          environment: staging
          api_token: ${{ secrets.DEPLOY_TOKEN }}

      - name: Run integration tests
        run: |
          npx playwright test --project=integration

  request-approval:
    name: Request Production Approval
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - name: Create approval issue
        id: create-issue
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const issue = await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🚀 Production Deployment Approval: ${process.env.GITHUB_SHA.substring(0, 7)}`,
              body: `
              ## Production Deployment Request
              
              * Commit: ${process.env.GITHUB_SHA}
              * Branch: ${process.env.GITHUB_REF}
              * Workflow: [${process.env.GITHUB_WORKFLOW}](${process.env.GITHUB_SERVER_URL}/${context.repo.owner}/${context.repo.repo}/actions/runs/${process.env.GITHUB_RUN_ID})
              * Staging URL: https://staging.example.com
              
              Please review the staging deployment and approve or reject the production deployment.
              
              ### Approval Process
              1. Review the staging deployment
              2. Comment on this issue with \`/approve\` to approve
              3. Comment with \`/reject\` to reject
              `
            });
            console.log(`Issue created: ${issue.data.html_url}`);
            return { issue_number: issue.data.number };

      - name: Set output
        run: echo "APPROVAL_ISSUE=${{ steps.create-issue.outputs.issue_number }}" >> $GITHUB_ENV

  wait-for-approval:
    name: Wait for Approval
    needs: request-approval
    runs-on: ubuntu-latest
    environment:
      name: production-approval
    steps:
      - name: Approval granted
        run: echo "Approval granted. Proceeding with production deployment."

  deploy-production:
    name: Deploy to Production
    needs: wait-for-approval
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build-artifact
          path: build/

      - name: Deploy to production
        uses: some-deployment-action@v1
        with:
          environment: production
          api_token: ${{ secrets.DEPLOY_TOKEN }}

      - name: Verify deployment
        run: |
          curl -f https://example.com/health || exit 1

      - name: Close approval issue
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ env.APPROVAL_ISSUE }},
              body: '✅ Production deployment completed successfully!'
            });
            await github.rest.issues.update({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ env.APPROVAL_ISSUE }},
              state: 'closed'
            });
```

## Rollback Workflows

```yaml
# .github/workflows/rollback.yml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to rollback"
        required: true
        type: choice
        options:
          - staging
          - production
      version:
        description: "Version to roll back to (leave empty for previous)"
        required: false
      reason:
        description: "Reason for rollback"
        required: true

jobs:
  prepare-rollback:
    name: Prepare Rollback
    runs-on: ubuntu-latest
    outputs:
      rollback_version: ${{ steps.get-version.outputs.version }}

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Determine rollback version
        id: get-version
        run: |
          if [[ -n "${{ github.event.inputs.version }}" ]]; then
            echo "Using specified version ${{ github.event.inputs.version }}"
            echo "version=${{ github.event.inputs.version }}" >> $GITHUB_OUTPUT
          else
            # Find previous version deployed to this environment
            PREV_TAG=$(git tag -l "${{ github.event.inputs.environment }}-*" --sort=-creatordate | sed -n 2p)
            if [[ -z "$PREV_TAG" ]]; then
              echo "No previous version found. Using latest stable version."
              PREV_TAG=$(git tag -l "stable-*" --sort=-creatordate | head -n 1)
            fi
            echo "Using previous version $PREV_TAG"
            echo "version=$PREV_TAG" >> $GITHUB_OUTPUT
          fi

      - name: Log rollback information
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🔄 Rollback to ${{ steps.get-version.outputs.version }} in ${{ github.event.inputs.environment }}`,
              body: `
              ## Rollback Initiated
              
              * Environment: ${{ github.event.inputs.environment }}
              * Rolling back to: ${{ steps.get-version.outputs.version }}
              * Initiated by: @${{ github.actor }}
              * Reason: ${{ github.event.inputs.reason }}
              * Time: ${new Date().toISOString()}
              
              Workflow: [${process.env.GITHUB_WORKFLOW}](${process.env.GITHUB_SERVER_URL}/${context.repo.owner}/${context.repo.repo}/actions/runs/${process.env.GITHUB_RUN_ID})
              `
            });

  execute-rollback:
    name: Execute Rollback
    needs: prepare-rollback
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          ref: ${{ needs.prepare-rollback.outputs.rollback_version }}

      - name: Download artifact
        uses: actions/download-artifact@v3
        with:
          name: build-${{ needs.prepare-rollback.outputs.rollback_version }}
          path: build/

      - name: Deploy previous version
        uses: some-deployment-action@v1
        with:
          environment: ${{ github.event.inputs.environment }}
          api_token: ${{ secrets.DEPLOY_TOKEN }}

      - name: Verify deployment
        run: |
          curl -f https://${{ github.event.inputs.environment == 'production' && 'example.com' || 'staging.example.com' }}/health || exit 1

      - name: Notify team
        run: |
          # Send notification about rollback
          echo "Rollback completed to version ${{ needs.prepare-rollback.outputs.rollback_version }}"

      - name: Create rollback tag
        run: |
          git tag "${{ github.event.inputs.environment }}-rollback-$(date +'%Y.%m.%d-%H%M')"
          git push --tags
```

## Canary Deployments

```yaml
# .github/workflows/canary-deployment.yml
name: Canary Deployment

on:
  workflow_dispatch:
    inputs:
      traffic_percentage:
        description: "Percentage of traffic to route to canary (5-50)"
        required: true
        default: "10"

jobs:
  deploy-canary:
    name: Deploy Canary
    runs-on: ubuntu-latest
    environment:
      name: production-canary
      url: https://canary.example.com
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Deploy canary
        uses: some-deployment-action@v1
        with:
          environment: production-canary
          api_token: ${{ secrets.DEPLOY_TOKEN }}

      - name: Configure traffic split
        run: |
          echo "Configuring ${{ github.event.inputs.traffic_percentage }}% traffic to canary"
          # Example command to configure traffic routing
          # aws cloudfront update-distribution --id ${{ secrets.CF_DISTRIBUTION_ID }} --traffic-config '{"canary": ${{ github.event.inputs.traffic_percentage }}}'

      - name: Monitor canary deployment
        id: monitor
        run: |
          # Set up monitoring for 15 minutes
          START_TIME=$(date +%s)
          END_TIME=$((START_TIME + 900))
          STATUS="success"

          while [ $(date +%s) -lt $END_TIME ]; do
            # Check error rate
            ERROR_RATE=$(curl -s https://monitoring.example.com/api/error-rate)
            if [ $(echo "$ERROR_RATE > 0.05" | bc) -eq 1 ]; then
              echo "Error rate too high: $ERROR_RATE"
              STATUS="failure"
              break
            fi
            
            # Check response time
            RESPONSE_TIME=$(curl -s https://monitoring.example.com/api/response-time)
            if [ $(echo "$RESPONSE_TIME > 500" | bc) -eq 1 ]; then
              echo "Response time too high: $RESPONSE_TIME ms"
              STATUS="failure"
              break
            fi
            
            sleep 60
          done

          echo "status=$STATUS" >> $GITHUB_OUTPUT

  promote-or-rollback:
    name: Promote or Rollback
    needs: deploy-canary
    runs-on: ubuntu-latest
    steps:
      - name: Decide action
        id: decide
        run: echo "action=${{ needs.deploy-canary.outputs.status == 'success' && 'promote' || 'rollback' }}" >> $GITHUB_OUTPUT

      - name: Rollback canary
        if: steps.decide.outputs.action == 'rollback'
        run: |
          echo "Rolling back canary deployment due to detected issues"
          # Reset traffic to 0% for canary
          # aws cloudfront update-distribution --id ${{ secrets.CF_DISTRIBUTION_ID }} --traffic-config '{"canary": 0}'

      - name: Promote canary
        if: steps.decide.outputs.action == 'promote'
        run: |
          echo "Promoting canary deployment to 100% traffic"
          # Scale up canary and scale down previous version
          # aws cloudfront update-distribution --id ${{ secrets.CF_DISTRIBUTION_ID }} --traffic-config '{"canary": 100}'
```

These examples demonstrate a variety of GitHub Actions workflows that implement DevOps best practices in accordance with the Deployment Infrastructure Standards. Adapt these templates to your specific technology stack and requirements.
