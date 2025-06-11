# Do No Harm Examples for File Operations

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide provides comprehensive examples of implementing the "Do No Harm" principle as described in [103-do-no-harm.mdc](mdc:departments/engineering/coding-standards/103-do-no-harm.mdc).

## Table of Contents

1. [VIBE Coding Protection Patterns](#vibe-coding-protection-patterns)
2. [Script Safety Implementation](#script-safety-implementation)
3. [Configuration-Based Protection](#configuration-based-protection)
4. [Documentation Patterns](#documentation-patterns)
5. [Code Comments for Protection](#code-comments-for-protection)
6. [Automated Check Examples](#automated-check-examples)

## VIBE Coding Protection Patterns

VIBE (Value-Informed, Behavioral-Embedded) coding allows developers to inform AI assistants about files that should be protected from unwanted modifications.

### Gitattributes Protection

Use `.gitattributes` to mark files that should not be modified by AI:

```
# .gitattributes
# Files that should not be modified by AI
path/to/critical-file.js linguist-generated=true
configuration/*.json ai-no-modify=true
legacy/* ai-preserve=true
```

### Protection Comments

Add standard header comments to files that should remain untouched:

```javascript
/**
 * @ai-preserve
 * This file contains critical business logic that has been carefully tuned.
 * DO NOT MODIFY without consulting the Architecture team.
 */
function calculateRegulatoryFees() {
  // Complex, validated calculation logic
}
```

### Config-Based Protection Registry

Create a protection registry file to centrally document protected files:

```json
// ai-protected-files.json
{
  "protected": [
    {
      "path": "src/core/billing-engine.js",
      "reason": "Contains audited financial calculations",
      "contact": "finance-team@example.com",
      "expiration": "2024-12-31"
    },
    {
      "path": "src/utils/compliance/*.js",
      "reason": "Regulatory compliance code",
      "contact": "legal@example.com"
    }
  ]
}
```

## Script Safety Implementation

### Bash Script Safety

```bash
#!/bin/bash
# Safe file operations script

# Define target file
TARGET_FILE="config/settings.json"

# Check if file exists before modifying
if [ -f "$TARGET_FILE" ]; then
  echo "File exists, creating backup..."
  # Create timestamped backup
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_FILE="${TARGET_FILE}.${TIMESTAMP}.bak"
  cp "$TARGET_FILE" "$BACKUP_FILE"

  # Now it's safe to modify
  echo "Modifying $TARGET_FILE with backup at $BACKUP_FILE"
  # ... modification code here
else
  echo "File does not exist, creating new file"
  # Create directory if it doesn't exist
  mkdir -p $(dirname "$TARGET_FILE")
  # Create the file
  echo "{}" > "$TARGET_FILE"
fi
```

### JavaScript File Operations

```javascript
const fs = require("fs");
const path = require("path");

/**
 * Safely writes data to a file with backup
 * @param {string} filePath - Path to the file
 * @param {string|Buffer} data - Data to write
 * @param {Object} options - Options
 * @param {boolean} options.createBackup - Whether to create a backup
 * @returns {Promise<void>}
 */
async function safeWrite(filePath, data, options = { createBackup: true }) {
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });

    // Check if file exists
    const fileExists = await fs.promises
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    // Create backup if file exists and backup is requested
    if (fileExists && options.createBackup) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = `${filePath}.${timestamp}.bak`;
      await fs.promises.copyFile(filePath, backupPath);
      console.log(`Created backup at ${backupPath}`);
    }

    // Write the file
    await fs.promises.writeFile(filePath, data);
    console.log(`Successfully wrote to ${filePath}`);
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error);
    throw error;
  }
}

// Usage example
safeWrite(
  "config/app-settings.json",
  JSON.stringify({ theme: "dark" }, null, 2)
).catch((err) => console.error("Failed to save settings:", err));
```

## Configuration-Based Protection

### AI Configuration File

```json
// .aiconfig
{
  "protection": {
    "enabled": true,
    "protectedPaths": [
      "src/core/financial-calculations.js",
      "src/utils/regulatory-compliance/*.js",
      "config/production-settings.json"
    ],
    "modificationRules": {
      "requireApproval": ["src/database/migrations/*"],
      "backupBeforeModify": ["src/api/controllers/*"],
      "allowedPatterns": {
        "src/components/experimental/*": {
          "allowModify": true,
          "requireComment": "AI-generated code, review required"
        }
      }
    }
  }
}
```

### Using .gitignore Patterns

Add a specific section to your .gitignore file to document AI-protected files:

```
# .gitignore

# Standard ignores
node_modules/
dist/
.env

# AI-PROTECTED FILES (DO NOT MODIFY)
# The following patterns mark files that should not be modified by AI tools
# Use the format: #ai-protected: reason
#ai-protected: src/legacy/billing-engine.js - Contains critical financial logic
#ai-protected: config/compliance/*.json - Regulatory settings
```

## Documentation Patterns

### Readme Protection Notice

Add a specific section to your README:

```markdown
## Protected Files

This project contains certain files that should **not be modified** without proper review:

| File Pattern                         | Reason                           | Contact      |
| ------------------------------------ | -------------------------------- | ------------ |
| `src/core/financial-calculations.js` | Contains audited financial logic | Finance Team |
| `src/api/compliance/*.js`            | Regulatory compliance code       | Legal Team   |
| `config/production*.json`            | Production configuration         | DevOps Team  |

When using AI assistants, please explicitly instruct them not to modify these files.
```

### Inline Documentation

```javascript
/**
 * Tax Calculation Module
 *
 * @module tax-calculator
 * @description
 * This module contains tax calculation logic that has been reviewed
 * and approved by the finance department and external auditors.
 *
 * @protection-level HIGH
 * @last-review 2025-04-15
 * @reviewed-by Finance Team, External Auditors
 *
 * DO NOT MODIFY this code without approval from the finance department.
 * Changes may have significant financial and legal implications.
 */

// Export specific tax calculation functions
```

## Code Comments for Protection

### Comment-Based Directives

```javascript
// @ai-preserve-start
// This section contains carefully optimized code for processing
// financial transactions. It has been audited and should not be
// modified without proper review.
function processTransaction(transaction) {
  // Implementation details...
}
// @ai-preserve-end

// This function can be safely modified
function formatTransactionReport(transaction) {
  // Implementation details...
}
```

### Database Schema Protection

```sql
-- @ai-preserve
-- This schema definition has been audited for compliance
-- with financial regulations. Do not modify structure without
-- approval from the database architecture team.
CREATE TABLE financial_transactions (
    transaction_id UUID PRIMARY KEY,
    amount DECIMAL(12,2) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id),
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    CONSTRAINT valid_amount CHECK (amount > 0)
);
```

## Automated Check Examples

### Pre-commit Hook

```bash
#!/bin/bash
# pre-commit hook to check for modifications to protected files

# Load protected files list
PROTECTED_FILES=$(grep -v '^#' .protected-files.txt)

# Get list of modified files in the commit
MODIFIED_FILES=$(git diff --cached --name-only)

# Check if any protected files are being modified
VIOLATIONS=""
for file in $MODIFIED_FILES; do
  for pattern in $PROTECTED_FILES; do
    if [[ $file == $pattern || $file == *$pattern* ]]; then
      VIOLATIONS="$VIOLATIONS\n$file (matches protected pattern: $pattern)"
    fi
  done
done

# If there are violations, abort the commit
if [ ! -z "$VIOLATIONS" ]; then
  echo -e "ERROR: Attempting to modify protected files:$VIOLATIONS"
  echo "These files require special approval before modification."
  echo "Please consult the responsible team before committing changes."
  exit 1
fi

exit 0
```

### CI Check for Protected Files

```yaml
# .github/workflows/protected-files-check.yml
name: Protected Files Check

on:
  pull_request:
    branches: [main, develop]

jobs:
  check-protected-files:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Check for protected file modifications
        run: |
          # Get list of files changed in this PR
          CHANGED_FILES=$(git diff --name-only ${{ github.event.pull_request.base.sha }} ${{ github.sha }})

          # Check against protected patterns
          VIOLATIONS=""
          while IFS= read -r pattern || [[ -n "$pattern" ]]; do
            if [[ ! $pattern == \#* && ! -z $pattern ]]; then
              for file in $CHANGED_FILES; do
                if [[ $file == $pattern || $file == *$pattern* ]]; then
                  VIOLATIONS="$VIOLATIONS\n$file (matches protected pattern: $pattern)"
                fi
              done
            fi
          done < .protected-files.txt

          # Report violations
          if [ ! -z "$VIOLATIONS" ]; then
            echo -e "Protected files have been modified:$VIOLATIONS"
            echo "These files require special review before merging."
            exit 1
          else
            echo "No protected files modified. Check passed!"
          fi
```

### Javascript Utility for Checking Protected Files

```javascript
// scripts/check-protected-files.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Load protection configuration
const config = JSON.parse(fs.readFileSync(".aiconfig", "utf8"));
const protectedPaths = config.protection.protectedPaths || [];

// Get modified files (either from git or command line args)
let modifiedFiles = [];
if (process.argv.length > 2) {
  modifiedFiles = process.argv.slice(2);
} else {
  // Get files modified in current working directory
  const gitOutput = execSync("git diff --name-only HEAD").toString();
  modifiedFiles = gitOutput.split("\n").filter(Boolean);
}

// Check for violations
const violations = [];
for (const file of modifiedFiles) {
  for (const protectedPath of protectedPaths) {
    // Handle glob patterns
    if (protectedPath.includes("*")) {
      const regex = new RegExp(protectedPath.replace(/\*/g, ".*"));
      if (regex.test(file)) {
        violations.push({ file, pattern: protectedPath });
      }
    } else if (file === protectedPath || file.startsWith(`${protectedPath}/`)) {
      violations.push({ file, pattern: protectedPath });
    }
  }
}

// Report results
if (violations.length > 0) {
  console.error("❌ Protected files would be modified:");
  for (const { file, pattern } of violations) {
    console.error(`  - ${file} (matches protected pattern: ${pattern})`);
  }
  console.error(
    "\nPlease review these modifications carefully before proceeding."
  );
  process.exit(1);
} else {
  console.log("✅ No protected files would be modified.");
}
```

## Best Practices Summary

1. **Explicit Documentation**: Clearly document which files require protection
2. **Multiple Layers**: Use a combination of comments, configuration, and automation
3. **Review Process**: Define a clear process for when modifications are necessary
4. **Time Limits**: Consider adding expiration dates to protection markers
5. **Visibility**: Make protection markers highly visible to both humans and AI tools
6. **Centralization**: Maintain a central registry of protected files
7. **Automation**: Implement automated checks in pre-commit hooks and CI pipelines
8. **Explain Why**: Always document the reason for protection, not just what is protected
