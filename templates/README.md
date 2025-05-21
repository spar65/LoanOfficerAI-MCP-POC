# MCP Function Templates

This directory contains templates to help implement and test Model Completion Protocol (MCP) functions for the LoanOfficerAI application. These templates follow the guidelines established in the [Cursor rules](../.cursor/rules/502-mcp-function-debugging.mdc).

## Available Templates

1. **MCP Function Handler Template** - `mcp-function-handler-template.js`

   - Pattern for implementing robust MCP function handlers in `openai.js`
   - Includes entity verification, error handling, and response enhancement
   - Copy this template into the function handler section and customize

2. **MCP Test Script Template** - `mcp-function-test-template.js`
   - Pattern for creating comprehensive test scripts for MCP functions
   - Tests data layer, API endpoint, and LLM integration
   - Copy this template, rename it, and customize for specific functions

## Using the Templates

### Implementing a New MCP Function

1. Define the function schema in the `mcpFunctions` array in `openai.js`
2. Copy the handler template into the function handler section
3. Replace placeholder values with your specific function details:
   - `templateFunctionName` → Your function name
   - `/api/entity/${entityId}` → Entity verification endpoint
   - `/api/endpoint/${entityId}` → Main function endpoint

### Testing an MCP Function

1. Copy the test script template to a new file: `test-your-function-name.js`
2. Set configuration values at the top of the file:

   - `FUNCTION_NAME` - The name of your MCP function
   - `TEST_ENTITY_TYPE` - The type of entity (e.g., "loan", "borrower")
   - `TEST_ENTITY_ID` - A valid test ID (e.g., "L002", "B001")
   - `TEST_PARAMETERS` - Parameters for your function
   - `API_ENDPOINT` - The API endpoint to test
   - `TEST_QUERY` - Natural language test query

3. Run the test script:
   ```
   node test-your-function-name.js
   ```

## Debugging Process

When debugging MCP functions, follow this process:

1. **Data Layer Verification**

   - Verify that the necessary data exists
   - Check entity and relationship integrity

2. **API Endpoint Testing**

   - Test the API endpoint directly
   - Verify expected behavior and error handling

3. **MCP Function Testing**
   - Test the full LLM integration
   - Verify natural language understanding

## Best Practices

- Always check entity existence before attempting operations
- Provide detailed, contextual error messages
- Include summary fields to explain results
- Add contextual metrics and thresholds
- Use comprehensive logging throughout the process
