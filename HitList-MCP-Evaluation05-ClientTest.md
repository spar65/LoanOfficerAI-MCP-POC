> client-new@1.0.0 test
> react-scripts test

FAIL src/tests/unit/Dashboard.test.js
● Test suite failed to run

    Cannot find module '@mui/x-charts/PieChart' from 'src/tests/unit/Dashboard.test.js'

      42 |
      43 | // Mock MUI components that might cause issues
    > 44 | jest.mock('@mui/x-charts/PieChart', () => {
         |      ^
      45 |   return function MockPieChart() {
      46 |     return <div data-testid="mock-pie-chart" />;
      47 |   };

      at Resolver.resolveModule (node_modules/jest-resolve/build/resolver.js:324:11)
      at Object.<anonymous> (src/tests/unit/Dashboard.test.js:44:6)

FAIL src/tests/integration/App.test.js
● Test suite failed to run

    Cannot find module '@mui/x-charts/PieChart' from 'src/tests/integration/App.test.js'

      47 |
      48 | // Mock MUI components that might cause issues
    > 49 | jest.mock('@mui/x-charts/PieChart', () => {
         |      ^
      50 |   return function MockPieChart() {
      51 |     return <div data-testid="mock-pie-chart" />;
      52 |   };

      at Resolver.resolveModule (node_modules/jest-resolve/build/resolver.js:324:11)
      at Object.<anonymous> (src/tests/integration/App.test.js:49:6)

FAIL src/tests/unit/client-api.test.js
● Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/client/node_modules/axios/index.js:1
    ({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,jest){import axios from './lib/axios.js';
                                                                                      ^^^^^^

    SyntaxError: Cannot use import statement outside a module

      3 |  * Tests for the client-side API client with authentication
      4 |  */
    > 5 | import axios from 'axios';
        | ^
      6 | import mcpClient from '../../mcp/client';
      7 | import authService from '../../mcp/authService';
      8 |

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1728:14)
      at Object.<anonymous> (src/tests/unit/client-api.test.js:5:1)

FAIL src/tests/utility.test.js
● Console

    console.log
      Fetching all loans...

      at Object.getAllLoans (src/mcp/client.js:60:15)

    console.log
      API request with auth token: Missing

      at Object.getConfig (src/mcp/client.js:16:13)

    console.error
      getAllLoans setup error: Cannot read properties of undefined (reading 'data')

      51 |     } else {
      52 |       // Something happened in setting up the request
    > 53 |       console.error(`${endpoint} setup error:`, error.message);
         |               ^
      54 |     }
      55 |     return error;
      56 |   },

      at Object.handleApiError (src/mcp/client.js:53:15)
      at Object.getAllLoans (src/mcp/client.js:65:12)
      at Object.<anonymous> (src/tests/utility.test.js:25:5)

    console.log
      Fetching details for loan L001...

      at Object.getLoanDetails (src/mcp/client.js:83:15)

    console.log
      API request with auth token: Missing

      at Object.getConfig (src/mcp/client.js:16:13)

    console.error
      getLoanDetails setup error: Cannot read properties of undefined (reading 'data')

      51 |     } else {
      52 |       // Something happened in setting up the request
    > 53 |       console.error(`${endpoint} setup error:`, error.message);
         |               ^
      54 |     }
      55 |     return error;
      56 |   },

      at Object.handleApiError (src/mcp/client.js:53:15)
      at Object.getLoanDetails (src/mcp/client.js:87:12)
      at Object.<anonymous> (src/tests/utility.test.js:30:5)

    console.log
      Fetching all borrowers...

      at Object.getBorrowers (src/mcp/client.js:156:15)

    console.log
      API request with auth token: Missing

      at Object.getConfig (src/mcp/client.js:16:13)

    console.error
      getBorrowers setup error: Cannot read properties of undefined (reading 'data')

      51 |     } else {
      52 |       // Something happened in setting up the request
    > 53 |       console.error(`${endpoint} setup error:`, error.message);
         |               ^
      54 |     }
      55 |     return error;
      56 |   },

      at Object.handleApiError (src/mcp/client.js:53:15)
      at Object.getBorrowers (src/mcp/client.js:160:12)
      at Object.<anonymous> (src/tests/utility.test.js:35:5)

● MCP Client Utilities › getAllLoans forms the correct URL

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "http://localhost:3001/api/loans"
    Received: "http://localhost:3001/api/loans", {"headers": {}, "withCredentials": true}

    Number of calls: 1

      24 |   test('getAllLoans forms the correct URL', async () => {
      25 |     await mcpClient.getAllLoans();
    > 26 |     expect(axios.get).toHaveBeenCalledWith('http://localhost:3001/api/loans');
         |                       ^
      27 |   });
      28 |
      29 |   test('getLoanDetails forms the correct URL', async () => {

      at Object.<anonymous> (src/tests/utility.test.js:26:23)

● MCP Client Utilities › getLoanDetails forms the correct URL

    TypeError: Cannot read properties of undefined (reading 'data')

      83 |       console.log(`Fetching details for loan ${loanId}...`);
      84 |       const response = await axios.get(`${this.baseURL}/loan/${loanId}`, this.getConfig());
    > 85 |       return response.data;
         |                       ^
      86 |     } catch (error) {
      87 |       this.handleApiError(error, 'getLoanDetails');
      88 |       throw error;

      at Object.getLoanDetails (src/mcp/client.js:85:23)
      at Object.<anonymous> (src/tests/utility.test.js:30:5)

● MCP Client Utilities › getBorrowers forms the correct URL

    TypeError: Cannot read properties of undefined (reading 'data')

      156 |       console.log('Fetching all borrowers...');
      157 |       const response = await axios.get(`${this.baseURL}/borrowers`, this.getConfig());
    > 158 |       return response.data;
          |                       ^
      159 |     } catch (error) {
      160 |       this.handleApiError(error, 'getBorrowers');
      161 |       throw error;

      at Object.getBorrowers (src/mcp/client.js:158:23)
      at Object.<anonymous> (src/tests/utility.test.js:35:5)

FAIL src/tests/unit/App.test.js
● Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/client/node_modules/axios/index.js:1
    ({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,jest){import axios from './lib/axios.js';
                                                                                      ^^^^^^

    SyntaxError: Cannot use import statement outside a module

      1 | import React, { useState, useRef, useEffect } from 'react';
      2 | import mcpClient from '../mcp/client';
    > 3 | import axios from 'axios';
        | ^
      4 | import authService from '../mcp/authService';  // Import auth service
      5 | import {
      6 |   Box,

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1728:14)
      at Object.<anonymous> (src/components/Chatbot.js:3:1)
      at Object.<anonymous> (src/App.js:9:1)
      at Object.<anonymous> (src/tests/unit/App.test.js:2:1)

FAIL src/tests/unit/Chatbot.test.js
● Chatbot Component › renders the chatbot interface with correct title

    TypeError: Cannot destructure property 'current' of 'React.useRef(...)' as it is undefined.

      53 |
      54 |   it('renders the chatbot interface with correct title', () => {
    > 55 |     render(
         |           ^
      56 |       <ThemeProvider theme={farmTheme}>
      57 |         <Chatbot onClose={() => {}} />
      58 |       </ThemeProvider>

      at InputBase (node_modules/@mui/material/InputBase/InputBase.js:296:14)
      at Object.react-stack-bottom-frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateForwardRef (node_modules/react-dom/cjs/react-dom-client.development.js:8645:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10861:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at Object.<anonymous>.process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:859:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/tests/unit/Chatbot.test.js:55:11)

● Chatbot Component › displays initial welcome message

    TypeError: Cannot destructure property 'current' of 'React.useRef(...)' as it is undefined.

      64 |
      65 |   it('displays initial welcome message', () => {
    > 66 |     render(
         |           ^
      67 |       <ThemeProvider theme={farmTheme}>
      68 |         <Chatbot onClose={() => {}} />
      69 |       </ThemeProvider>

      at InputBase (node_modules/@mui/material/InputBase/InputBase.js:296:14)
      at Object.react-stack-bottom-frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateForwardRef (node_modules/react-dom/cjs/react-dom-client.development.js:8645:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10861:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at Object.<anonymous>.process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:859:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/tests/unit/Chatbot.test.js:66:11)

● Chatbot Component › includes quick action buttons for common loan queries

    TypeError: Cannot destructure property 'current' of 'React.useRef(...)' as it is undefined.

      75 |
      76 |   it('includes quick action buttons for common loan queries', () => {
    > 77 |     render(
         |           ^
      78 |       <ThemeProvider theme={farmTheme}>
      79 |         <Chatbot onClose={() => {}} />
      80 |       </ThemeProvider>

      at InputBase (node_modules/@mui/material/InputBase/InputBase.js:296:14)
      at Object.react-stack-bottom-frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateForwardRef (node_modules/react-dom/cjs/react-dom-client.development.js:8645:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10861:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at Object.<anonymous>.process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:859:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/tests/unit/Chatbot.test.js:77:11)

● Chatbot Component › properly configures OpenAI function schemas

    expect(received).toBeDefined()

    Received: undefined

      93 |
      94 |     // Verify that function schemas are properly defined
    > 95 |     expect(MCP_FUNCTIONS).toBeDefined();
         |                           ^
      96 |
      97 |     // Check that essential functions are defined
      98 |     const functionNames = MCP_FUNCTIONS.map(f => f.name);

      at Object.<anonymous> (src/tests/unit/Chatbot.test.js:95:27)

Test Suites: 6 failed, 6 total
Tests: 7 failed, 1 passed, 8 total
Snapshots: 0 total
Time: 1.535 s
Ran all test suites related to changed files.
