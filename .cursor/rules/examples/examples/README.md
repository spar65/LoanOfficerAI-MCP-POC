# Enterprise Cursor Rules - Example Documentation

This directory contains **documentation examples** to help developers implement the Enterprise Cursor Rules correctly.

## Important Notes

- These examples are **reference implementations only** and are not meant to be imported or used directly
- The code snippets demonstrate patterns and practices described in the rules
- No actual dependencies are required to view these examples

## How to Use These Examples

1. Reference these examples when implementing components that should follow the rules
2. Use the patterns and structures shown here as a guide, not as code to copy directly
3. Apply the principles demonstrated in these examples to your specific use case

## Examples Access Strategy

To ensure these examples remain accessible after deployment to Cursor, we follow a three-pronged approach:

1. **Directory Structure**: Examples are organized in domain-specific directories (`security`, `styling`, `components`, etc.)
2. **Rules Integration**: Each rule links directly to its related examples in this directory
3. **Centralized Examples Guide**: All examples are cataloged in `core/003-examples-guide.mdc`
4. **Deployment Script**: The deployment script (`tools/deploy_cursor_rules.sh`) has been modified to include these example files when deploying to Cursor

When accessing the rules through Cursor, you can locate examples through:

- Links within individual rule files
- The centralized Examples Guide
- Direct access to the examples directory in the deployed rules

## Directory Structure

- `components/` - Examples related to component implementation
- `security/` - Security implementation examples
- `styling/` - CSS architecture and styling examples
- `ComponentArchitectureGuide.md` - Comprehensive guide for UI component architecture
- `UX-Stability-Implementation-Guide.md` - Guide for implementing UX stability

## Relationship to Rules

Each example corresponds to specific rules in the enterprise-cursor-rules structure. The examples are organized to mirror the rule organization and provide practical guidance on implementation.

- For CSS Architecture, see: `departments/product/050-css-architecture.mdc`
- For Security Design System, see: `departments/engineering/security/047-security-design-system.mdc`
- For Session Validation, see: `departments/engineering/security/046-session-validation.mdc`
- For UI Component Architecture, see: `technologies/frameworks/042-ui-component-architecture.mdc`
- For UX Stability Guidelines, see: `departments/product/040-ux-stability.mdc`

## Contributing New Examples

When adding new examples:

1. Create the example in the appropriate domain directory
2. Add a link to the example in its corresponding rule file
3. Update the central Examples Guide (`003-examples-guide.mdc`)
4. Include a disclaimer at the top that the example is for reference only
5. Follow the formatting and structure patterns established in existing examples
