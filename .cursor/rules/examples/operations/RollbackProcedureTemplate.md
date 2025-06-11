# Rollback Procedure Template

This document outlines standardized rollback procedures to be used when a deployment fails or causes unexpected issues. It aligns with the requirements specified in the [Deployment Infrastructure Standards](../../departments/engineering/operations/200-deployment-infrastructure.mdc).

## Rollback Decision Framework

### Rollback Criteria

| Severity | Description                                       | Rollback Required? | Timeframe           |
| -------- | ------------------------------------------------- | ------------------ | ------------------- |
| Critical | Service is down or unusable for most users        | Yes                | Immediate           |
| Major    | Key functionality broken, significant user impact | Yes                | Within 1 hour       |
| Moderate | Partial functionality affected, workarounds exist | Maybe              | After investigation |
| Minor    | Cosmetic issues, rare edge cases                  | No                 | Fix in next release |

### Automated Rollback Triggers

- Error rate exceeds 5% of requests (previous baseline + 3%)
- Response time exceeds 2000ms (previous baseline + 100%)
- CPU utilization exceeds 85% for 5 minutes
- Memory utilization exceeds 90% for 5 minutes
- More than 50% of health checks fail

## Pre-Deployment Rollback Preparation

1. **Tag Previous Stable Version**

   - Always tag the current stable version before deploying
   - Example: `git tag -a production-2023-11-01 -m "Last stable production"`

2. **Database Rollback Scripts**

   - Every schema change must have a corresponding rollback script
   - Store in version control alongside migration scripts
   - Example: `migrations/20231101_add_user_columns.up.sql` and `migrations/20231101_add_user_columns.down.sql`

3. **Artifact Preservation**

   - Keep previous deployment artifacts accessible for at least 30 days
   - Store build logs and configuration used

4. **Environment Snapshot**
   - Document current environment state
   - Capture infrastructure configuration
   - Record external service versions and dependencies

## Rollback Types

### 1. Code/Application Rollback

#### Redeploy Previous Version

```bash
# Example Git-based rollback
git checkout production-2023-11-01
git push origin HEAD:main --force

# OR using container registry
docker pull myapp:previous-stable
docker tag myapp:previous-stable myapp:production
docker push myapp:production
```

#### GitHub Actions Workflow

```yaml
# .github/workflows/rollback.yml
name: Emergency Rollback

on:
  workflow_dispatch:
    inputs:
      version_tag:
        description: "Previous stable version tag"
        required: true
        default: "production-latest"

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Checkout previous version
        run: |
          git checkout ${{ github.event.inputs.version_tag }}

      - name: Deploy previous version
        run: |
          echo "Deploying previous version ${{ github.event.inputs.version_tag }}"
          # Deployment commands here

      - name: Verify deployment
        run: |
          # Health check scripts
          curl -f https://example.com/health || exit 1

      - name: Notify team
        run: |
          # Send notification that rollback was performed
```

### 2. Database Rollback

#### Schema Rollback

```bash
# Roll back last migration using a tool like Flyway or Liquibase
flyway migrate -target=2023.10.31

# OR using raw SQL
psql -h database.example.com -U admin -d myapp -f migrations/20231101_add_user_columns.down.sql
```

#### Data Rollback

```bash
# Restore from point-in-time backup
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier myapp-prod \
  --target-db-instance-identifier myapp-prod-restored \
  --restore-time 2023-11-01T08:00:00Z

# OR restore specific tables/data
pg_restore -h database.example.com -U admin -d myapp -t users backup_2023_11_01.dump
```

### 3. Infrastructure Rollback

#### Using Infrastructure as Code

```bash
# Terraform rollback to previous state
git checkout infrastructure-2023-11-01
terraform plan
terraform apply

# OR revert to specific Terraform state
terraform state pull > current.tfstate
terraform apply -state=backup_2023_11_01.tfstate
```

#### Cloud Provider Specific

```bash
# AWS CloudFormation
aws cloudformation update-stack \
  --stack-name myapp-production \
  --template-url https://s3.amazonaws.com/templates/previous-template.yml \
  --parameters ParameterKey=Environment,ParameterValue=production

# Kubernetes
kubectl rollout undo deployment/myapp
```

## Rollback Execution Checklist

1. **Assessment Phase (2-5 minutes)**

   - [ ] Confirm deployment issue and impact
   - [ ] Determine appropriate rollback strategy
   - [ ] Notify team of issue and rollback intention
   - [ ] Escalate to incident management if needed

2. **Preparation Phase (2-5 minutes)**

   - [ ] Identify last stable version/artifact
   - [ ] Verify availability of rollback resources
   - [ ] Prepare database rollback scripts if needed
   - [ ] Update status page or notification system

3. **Execution Phase (5-15 minutes)**

   - [ ] Execute application rollback
   - [ ] Execute database rollback if needed
   - [ ] Execute infrastructure rollback if needed
   - [ ] Update DNS/routing if needed

4. **Verification Phase (5-10 minutes)**

   - [ ] Run health checks
   - [ ] Verify critical user flows
   - [ ] Confirm system metrics return to normal
   - [ ] Test any components affected by reported issues

5. **Communication Phase (5-10 minutes)**
   - [ ] Update status page
   - [ ] Notify stakeholders of rollback completion
   - [ ] Document incident and rollback details
   - [ ] Schedule post-mortem meeting

## Specialized Rollback Scenarios

### Microservices Rollback

When dealing with microservices architecture:

1. Identify service dependency chain
2. Roll back services in reverse dependency order
3. Consider temporary API compatibility layer if needed

```bash
# Example rolling back multiple services
kubectl rollout undo deployment/auth-service
kubectl rollout undo deployment/user-service
kubectl rollout undo deployment/api-gateway
```

### Partial Rollback

For complex deployments, sometimes only part of the system needs rollback:

```bash
# Example rolling back just one feature flag
curl -X PATCH https://featureflags.example.com/api/flags/new-payment-process \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"enabled": false}'
```

### Canary Deployment Rollback

```bash
# Shift traffic back to stable version
kubectl scale deployment/myapp-canary --replicas=0
kubectl scale deployment/myapp-stable --replicas=10
```

## Post-Rollback Actions

1. **Root Cause Analysis**

   - Investigate what went wrong
   - Document the issue and solution
   - Update test coverage to prevent future occurrences

2. **Process Improvement**

   - Review deployment process
   - Improve automated testing
   - Update monitoring and alerts

3. **Redeployment Plan**
   - Fix issues in development
   - Test thoroughly in staging
   - Schedule new deployment with additional safeguards

## Rollback Prevention Strategies

1. **Feature Flags**

   - Wrap new features in feature flags
   - Can be disabled without code rollback
   - Enable gradual rollout and fast disabling

2. **Canary Deployments**

   - Deploy to small subset of users/servers first
   - Monitor for issues before full deployment
   - Automatically roll back on threshold violations

3. **Blue/Green Deployments**
   - Deploy new version alongside old
   - Test thoroughly before switching traffic
   - Can switch back instantly if issues found

## Rollback Metrics and Monitoring

Track these metrics to evaluate rollback effectiveness:

1. **Time to Detect** - How long from deployment to issue detection
2. **Time to Decision** - How long to decide on rollback
3. **Time to Rollback** - How long to execute the rollback
4. **Rollback Success Rate** - Percentage of successful rollbacks
5. **Recovery Time** - How long until system returns to normal operation

## Common Rollback Pitfalls

1. ❌ **Incompatible Database Schemas** - New code depends on new schema
2. ❌ **External Service Dependencies** - New code expects specific API version
3. ❌ **Incomplete Rollback** - Some components remain on new version
4. ❌ **Cached Data** - Old code with new cached data structures
5. ❌ **Asynchronous Processes** - In-flight operations between versions

## Emergency Contacts

Maintain a list of contacts who can authorize and execute rollbacks:

| Role             | Name   | Contact   | Backup Contact |
| ---------------- | ------ | --------- | -------------- |
| DevOps Lead      | [NAME] | [CONTACT] | [BACKUP]       |
| Database Admin   | [NAME] | [CONTACT] | [BACKUP]       |
| System Architect | [NAME] | [CONTACT] | [BACKUP]       |
| Product Owner    | [NAME] | [CONTACT] | [BACKUP]       |
