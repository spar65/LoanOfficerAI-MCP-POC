
> mcp-server@1.0.0 test
> jest --config jest.config.js

PASS tests/unit/simple.test.js
  Simple Tests
    ✓ true should be true (2 ms)
    ✓ math operations work correctly (1 ms)
    ✓ string operations work correctly (2 ms)
    ✓ array operations work correctly (2 ms)

PASS tests/unit/mock-data.test.js
  Mock Data Tests
    ✓ loans have the expected structure (5 ms)
    ✓ borrowers have the expected structure (2 ms)
    ✓ can calculate total loan amount (1 ms)
    ✓ can join loan and borrower data (1 ms)

PASS tests/unit/openai-schemas.test.js
  OpenAI Integration Schema Tests
    ✓ MCP function schemas are valid for OpenAI (10 ms)
    ✓ OpenAI API key validation logic works correctly (1 ms)
    ✓ Response handlers correctly process different OpenAI formats (3 ms)

PASS tests/unit/auth-utils.test.js
  Auth Utilities
    Password Validation
      ✓ strong password should be valid (3 ms)
      ✓ weak passwords should be invalid (1 ms)
    Token Utilities
      ✓ can extract token from authorization header (2 ms)
      ✓ can validate token expiration (5 ms)
    Role-Based Access Control
      ✓ can check if user has required role (1 ms)
      ✓ can check if admin user can access multi-tenant data (1 ms)

PASS tests/unit/utils.test.js
  Utility Functions
    ✓ formatCurrency formats amount correctly (35 ms)
    ✓ calculateMonthlyPayment calculates correctly (10 ms)
    ✓ calculateTotalInterest calculates correctly (10 ms)
    ✓ formatDate formats date correctly (16 ms)
    ✓ getFullName combines names correctly

FAIL tests/unit/auth-implementation.test.js
  ● Test suite failed to run

    TypeError: path.resolve is not a function

      3 |  * Tests for the implemented authentication flow in the MCP POC
      4 |  */
    > 5 | const bcrypt = require('bcrypt');
        |                ^
      6 | const jwt = require('jsonwebtoken');
      7 |
      8 | // Mock fs and path modules to avoid actual file operations

      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:49)
      at Object.require (tests/unit/auth-implementation.test.js:5:16)

  console.log
    Loaded 35 refresh tokens

      at Object.log (auth/tokenService.js:26:13)

  console.log
    Loaded 35 refresh tokens

      at Object.log (auth/tokenService.js:26:13)

  console.log
    Loaded 35 refresh tokens

      at Object.log (auth/tokenService.js:26:13)

FAIL tests/unit/loan-details.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/loan-details.test.js:9:16)

FAIL tests/unit/api.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/api.test.js:12:16)

FAIL tests/unit/edge-cases.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/edge-cases.test.js:9:16)

  console.log
    Loaded 35 refresh tokens

      at Object.log (auth/tokenService.js:26:13)

FAIL tests/unit/loan-summary.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/loan-summary.test.js:9:16)

  console.error
    Error loading refresh tokens: SyntaxError: "undefined" is not valid JSON
        at JSON.parse (<anonymous>)
        at Object.parse (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/auth/tokenService.js:19:23)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/auth/authMiddleware.js:5:22)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:18:24)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/unit/data-loading.test.js:13:16)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
        at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
        at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)

      27 |   }
      28 | } catch (err) {
    > 29 |   console.error('Error loading refresh tokens:', err);
         |           ^
      30 |   // Continue without persisted tokens
      31 | }
      32 |

      at Object.error (auth/tokenService.js:29:11)
      at Object.require (auth/authMiddleware.js:5:22)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/data-loading.test.js:13:16)

FAIL tests/unit/data-loading.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/data-loading.test.js:13:16)

  console.error
    Error loading refresh tokens: SyntaxError: "undefined" is not valid JSON
        at JSON.parse (<anonymous>)
        at Object.parse (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/auth/tokenService.js:19:23)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/auth/authMiddleware.js:5:22)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:18:24)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/unit/final-coverage.test.js:14:16)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
        at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
        at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)

      27 |   }
      28 | } catch (err) {
    > 29 |   console.error('Error loading refresh tokens:', err);
         |           ^
      30 |   // Continue without persisted tokens
      31 | }
      32 |

      at Object.error (auth/tokenService.js:29:11)
      at Object.require (auth/authMiddleware.js:5:22)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/final-coverage.test.js:14:16)

  console.log
    Loaded 35 refresh tokens

      at Object.log (auth/tokenService.js:26:13)

  console.error
    Error loading refresh tokens: SyntaxError: "undefined" is not valid JSON
        at JSON.parse (<anonymous>)
        at Object.parse (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/auth/tokenService.js:19:23)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/auth/authMiddleware.js:5:22)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:18:24)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/integration/auth-data-retrieval.test.js:6:13)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
        at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
        at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)

      27 |   }
      28 | } catch (err) {
    > 29 |   console.error('Error loading refresh tokens:', err);
         |           ^
      30 |   // Continue without persisted tokens
      31 | }
      32 |

      at Object.error (auth/tokenService.js:29:11)
      at Object.require (auth/authMiddleware.js:5:22)
      at Object.require (server.js:18:24)
      at Object.require (tests/integration/auth-data-retrieval.test.js:6:13)

FAIL tests/unit/final-coverage.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/final-coverage.test.js:14:16)

FAIL tests/integration/auth-data-retrieval.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/integration/auth-data-retrieval.test.js:6:13)

  console.error
    Error loading refresh tokens: TypeError: Cannot read properties of undefined (reading 'includes')
        at Object.includes (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/integration/auth-api.test.js:78:16)
        at /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-mock/build/index.js:397:39
        at Object.<anonymous> (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-mock/build/index.js:404:13)
        at Object.mockConstructor [as readFileSync] (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-mock/build/index.js:148:19)
        at Object.readFileSync (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/auth/tokenService.js:19:32)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/auth/authMiddleware.js:5:22)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:18:24)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/integration/auth-api.test.js:12:13)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
        at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
        at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)

      27 |   }
      28 | } catch (err) {
    > 29 |   console.error('Error loading refresh tokens:', err);
         |           ^
      30 |   // Continue without persisted tokens
      31 | }
      32 |

      at Object.error (auth/tokenService.js:29:11)
      at Object.require (auth/authMiddleware.js:5:22)
      at Object.require (server.js:18:24)
      at Object.require (tests/integration/auth-api.test.js:12:13)

  console.log
    Loaded 35 refresh tokens

      at Object.log (auth/tokenService.js:26:13)

  console.error
    Error loading refresh tokens: SyntaxError: "undefined" is not valid JSON
        at JSON.parse (<anonymous>)
        at Object.parse (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/auth/tokenService.js:19:23)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/auth/authMiddleware.js:5:22)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:18:24)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
        at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/unit/data-service.test.js:14:16)
        at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
        at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
        at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
        at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
        at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
        at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)

      27 |   }
      28 | } catch (err) {
    > 29 |   console.error('Error loading refresh tokens:', err);
         |           ^
      30 |   // Continue without persisted tokens
      31 | }
      32 |

      at Object.error (auth/tokenService.js:29:11)
      at Object.require (auth/authMiddleware.js:5:22)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/data-service.test.js:14:16)

FAIL tests/unit/data-service.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/data-service.test.js:14:16)

  console.log
    [2025-06-04T21:03:48.733Z] [INFO] OpenAI client initialized

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.787Z] [INFO] Initializing server...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.789Z] [INFO] Verifying data files...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.789Z] [DEBUG] Attempting to directly read borrowers.json...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.792Z] [DEBUG] Borrower B001 found in borrowers.json

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrower_id": "B001",
      "first_name": "John",
      "last_name": "Doe",
      "address": "123 Farm Rd, Smalltown, USA",
      "phone": "555-1234",
      "email": "john@example.com",
      "credit_score": 750,
      "income": 100000,
      "farm_size": 500,
      "farm_type": "Crop"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:48.794Z] [INFO] Borrowers data verified successfully

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrowerCount": 10,
      "b001Found": true
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:48.798Z] [INFO] Registering API routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.800Z] [INFO] Auth routes registered at /api/auth

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.800Z] [INFO] Registering feature routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.801Z] [INFO] Loan routes registered at /api/loans

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.802Z] [INFO] Borrower routes registered at /api/borrowers

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.802Z] [INFO] Risk routes registered at /api/risk

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.803Z] [INFO] Analytics routes registered at /api/analytics

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.804Z] [INFO] OpenAI routes registered at /api/openai

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.804Z] [INFO] Collateral routes registered at /api/collateral

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.805Z] [INFO] Payment routes registered at /api/payments

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.808Z] [INFO] OpenAI client initialized

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.808Z] [INFO] OpenAI client initialized

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.error
    [2025-06-04T21:03:48.807Z] [ERROR] OPENAI_API_KEY environment variable is not set

      52 |     
      53 |     // Log the message
    > 54 |     consoleMethod(formattedMessage);
         |     ^
      55 |     
      56 |     // Log metadata if provided
      57 |     if (metadata) {

      at Function.consoleMethod [as log] (services/logService.js:54:5)
      at Function.log [as error] (services/logService.js:85:16)
      at new error (services/openaiService.js:11:18)
      at Object.<anonymous> (services/openaiService.js:91:18)
      at Object.require (routes/openai.js:5:23)
      at Object.require (server.js:27:22)
      at Object.require (tests/integration/auth-api.test.js:12:13)

FAIL tests/integration/auth-api.test.js
  ● Test suite failed to run

    OpenAI API key is not configured

      10 |     if (!process.env.OPENAI_API_KEY) {
      11 |       LogService.error('OPENAI_API_KEY environment variable is not set');
    > 12 |       throw new Error('OpenAI API key is not configured');
         |             ^
      13 |     }
      14 |     
      15 |     this.client = new OpenAI({

      at new OpenAIService (services/openaiService.js:12:13)
      at Object.<anonymous> (services/openaiService.js:91:18)
      at Object.require (routes/openai.js:5:23)
      at Object.require (server.js:27:22)
      at Object.require (tests/integration/auth-api.test.js:12:13)

  console.log
    [2025-06-04T21:03:48.829Z] [INFO] Initializing server...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.830Z] [INFO] Initializing server...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.830Z] [INFO] Verifying data files...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.831Z] [INFO] Verifying data files...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.831Z] [DEBUG] Attempting to directly read borrowers.json...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.831Z] [DEBUG] Attempting to directly read borrowers.json...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.834Z] [DEBUG] Borrower B001 found in borrowers.json

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.834Z] [DEBUG] Borrower B001 found in borrowers.json

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrower_id": "B001",
      "first_name": "John",
      "last_name": "Doe",
      "address": "123 Farm Rd, Smalltown, USA",
      "phone": "555-1234",
      "email": "john@example.com",
      "credit_score": 750,
      "income": 100000,
      "farm_size": 500,
      "farm_type": "Crop"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    {
      "borrower_id": "B001",
      "first_name": "John",
      "last_name": "Doe",
      "address": "123 Farm Rd, Smalltown, USA",
      "phone": "555-1234",
      "email": "john@example.com",
      "credit_score": 750,
      "income": 100000,
      "farm_size": 500,
      "farm_type": "Crop"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:48.835Z] [INFO] Borrowers data verified successfully

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.835Z] [INFO] Borrowers data verified successfully

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrowerCount": 10,
      "b001Found": true
    }

      at Function.log (services/logService.js:59:17)

  console.log
    {
      "borrowerCount": 10,
      "b001Found": true
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:48.837Z] [INFO] Registering API routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.839Z] [INFO] Auth routes registered at /api/auth

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.838Z] [INFO] Registering API routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.839Z] [INFO] Registering feature routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.840Z] [INFO] Auth routes registered at /api/auth

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.841Z] [INFO] Registering feature routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.840Z] [INFO] Loan routes registered at /api/loans

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.841Z] [INFO] Loan routes registered at /api/loans

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.841Z] [INFO] Borrower routes registered at /api/borrowers

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.842Z] [INFO] Risk routes registered at /api/risk

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.843Z] [INFO] Analytics routes registered at /api/analytics

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.842Z] [INFO] Borrower routes registered at /api/borrowers

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.844Z] [INFO] OpenAI routes registered at /api/openai

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.844Z] [INFO] Risk routes registered at /api/risk

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.844Z] [INFO] Collateral routes registered at /api/collateral

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.844Z] [INFO] Analytics routes registered at /api/analytics

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.844Z] [INFO] Payment routes registered at /api/payments

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.845Z] [INFO] OpenAI routes registered at /api/openai

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.845Z] [INFO] Collateral routes registered at /api/collateral

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.846Z] [INFO] Payment routes registered at /api/payments

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.891Z] [INFO] MCP server tools configured

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:48.933Z] [MCP] 🔄 POST /api/openai/chat - MCP REQUEST

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:48.931Z] [INFO] MCP server tools configured

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "userId": "unauthenticated",
      "query": {},
      "params": {},
      "body": {
        "messages": [
          {
            "role": "user",
            "content": "Hello"
          }
        ]
      }
    }

      at Function.log (services/logService.js:59:17)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

  console.log
    [2025-06-04T21:03:48.935Z] [INFO] MCP server tools configured

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:48.938Z] [MCP] ✅ POST /api/openai/chat  401  - 2ms - MCP RESPONSE

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:48.947Z] [MCP] 🔄 POST /api/openai/chat - MCP REQUEST

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "userId": "unauthenticated",
      "query": {},
      "params": {},
      "body": {}
    }

      at Function.log (services/logService.js:59:17)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

  console.error
    [2025-06-04T21:03:48.952Z] [ERROR] Invalid OpenAI request format: Messages array is missing or invalid

      52 |     
      53 |     // Log the message
    > 54 |     consoleMethod(formattedMessage);
         |     ^
      55 |     
      56 |     // Log metadata if provided
      57 |     if (metadata) {

      at Function.consoleMethod [as log] (services/logService.js:54:5)
      at Function.log [as error] (services/logService.js:85:16)
      at error (routes/openai.js:390:18)
      at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
      at next (node_modules/express/lib/router/route.js:149:13)
      at next (auth/authMiddleware.js:51:3)
      at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
      at next (node_modules/express/lib/router/route.js:149:13)
      at Route.dispatch (node_modules/express/lib/router/route.js:119:3)
      at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
      at node_modules/express/lib/router/index.js:284:15
      at Function.process_params (node_modules/express/lib/router/index.js:346:12)
      at next (node_modules/express/lib/router/index.js:280:10)
      at Function.handle (node_modules/express/lib/router/index.js:175:3)
      at router (node_modules/express/lib/router/index.js:47:12)
      at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
      at trim_prefix (node_modules/express/lib/router/index.js:328:13)
      at node_modules/express/lib/router/index.js:286:9
      at Function.process_params (node_modules/express/lib/router/index.js:346:12)
      at next (node_modules/express/lib/router/index.js:280:10)
      at next (middleware/tenantMiddleware.js:50:12)
      at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
      at trim_prefix (node_modules/express/lib/router/index.js:328:13)
      at node_modules/express/lib/router/index.js:286:9
      at Function.process_params (node_modules/express/lib/router/index.js:346:12)
      at next (node_modules/express/lib/router/index.js:280:10)
      at Object.next [as verifyToken] (auth/authMiddleware.js:51:3)
      at verifyToken (server.js:213:18)
      at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
      at trim_prefix (node_modules/express/lib/router/index.js:328:13)
      at node_modules/express/lib/router/index.js:286:9
      at Function.process_params (node_modules/express/lib/router/index.js:346:12)
      at next (node_modules/express/lib/router/index.js:280:10)
      at next (middleware/requestLogger.js:33:3)
      at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
      at trim_prefix (node_modules/express/lib/router/index.js:328:13)
      at node_modules/express/lib/router/index.js:286:9
      at Function.process_params (node_modules/express/lib/router/index.js:346:12)
      at next (node_modules/express/lib/router/index.js:280:10)
      at cookieParser (node_modules/cookie-parser/index.js:57:14)
      at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
      at trim_prefix (node_modules/express/lib/router/index.js:328:13)
      at node_modules/express/lib/router/index.js:286:9
      at Function.process_params (node_modules/express/lib/router/index.js:346:12)
      at next (node_modules/express/lib/router/index.js:280:10)
      at node_modules/body-parser/lib/read.js:137:5
      at invokeCallback (node_modules/raw-body/index.js:238:16)
      at done (node_modules/raw-body/index.js:227:7)
      at IncomingMessage.onEnd (node_modules/raw-body/index.js:287:7)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:48.958Z] [MCP] ✅ POST /api/openai/chat  400  - 9ms - MCP RESPONSE

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

node:events:485
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::3001
    at Server.setupListenHandle [as _listen2] (node:net:1939:16)
    at listenInCluster (node:net:1996:12)
    at Server.listen (node:net:2101:7)
    at Function.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/express/lib/application.js:635:24)
    at Object.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:279:5)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
    at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/integration/api-flow.test.js:2:16)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
    at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
    at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1975:8)
    at processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'EADDRINUSE',
  errno: -48,
  syscall: 'listen',
  address: '::',
  port: 3001
}

Node.js v23.11.0
node:events:485
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::3001
    at Server.setupListenHandle [as _listen2] (node:net:1939:16)
    at listenInCluster (node:net:1996:12)
    at Server.listen (node:net:2101:7)
    at Function.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/express/lib/application.js:635:24)
    at Object.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:279:5)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
    at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/integration/api.test.js:2:16)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
    at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
    at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1975:8)
    at processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'EADDRINUSE',
  errno: -48,
  syscall: 'listen',
  address: '::',
  port: 3001
}

Node.js v23.11.0
  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:48.967Z] [MCP] 🔄 POST /api/openai/chat - MCP REQUEST

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "userId": "unauthenticated",
      "query": {},
      "params": {},
      "body": {
        "messages": [
          {
            "role": "system",
            "content": "You are a helpful assistant"
          },
          {
            "role": "user",
            "content": "Hello"
          }
        ]
      }
    }

      at Function.log (services/logService.js:59:17)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:48.970Z] [MCP] MCP PROTOCOL: OpenAI Chat Completion

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "messageCount": 2,
      "functionCount": 0,
      "functionCall": "auto"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:48.973Z] [MCP] MCP OPENAI REQUEST

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "model": "gpt-4o",
      "messageCount": 2,
      "functionCount": 19,
      "systemMessage": "You are a helpful assistant..."
    }

      at Function.log (services/logService.js:59:17)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:48.976Z] [MCP] MCP OPENAI RESPONSE (3ms)

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "tokensUsed": "unknown",
      "responseType": "message",
      "contentLength": 35,
      "duration": "3ms"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

  console.warn
    [2025-06-04T21:03:48.977Z] [WARN] No function call received

      52 |     
      53 |     // Log the message
    > 54 |     consoleMethod(formattedMessage);
         |     ^
      55 |     
      56 |     // Log metadata if provided
      57 |     if (metadata) {

      at Function.consoleMethod [as log] (services/logService.js:54:5)
      at Function.log [as warn] (services/logService.js:81:16)
      at warn (routes/openai.js:864:18)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:48.979Z] [MCP] ✅ POST /api/openai/chat  400  - 11ms - MCP RESPONSE

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:48.994Z] [MCP] 🔄 POST /api/openai/chat - MCP REQUEST

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "userId": "unauthenticated",
      "query": {},
      "params": {},
      "body": {
        "messages": [
          {
            "role": "system",
            "content": "You are a helpful assistant"
          },
          {
            "role": "user",
            "content": "Get loan details"
          }
        ],
        "functions": [
          {
            "name": "getLoanDetails",
            "description": "Get detailed information about a specific loan",
            "parameters": {
              "type": "object",
              "properties": {
                "loan_id": {
                  "type": "string",
                  "description": "The ID of the loan to retrieve"
                }
              },
              "required": [
                "loan_id"
              ]
            }
          }
        ],
        "function_call": "auto"
      }
    }

      at Function.log (services/logService.js:59:17)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:48.996Z] [MCP] MCP PROTOCOL: OpenAI Chat Completion

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "messageCount": 2,
      "functionCount": 1,
      "functionCall": "auto"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:48.999Z] [MCP] MCP OPENAI REQUEST

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "model": "gpt-4o",
      "messageCount": 2,
      "functionCount": 20,
      "systemMessage": "You are a helpful assistant..."
    }

      at Function.log (services/logService.js:59:17)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:49.005Z] [MCP] MCP OPENAI RESPONSE (6ms)

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "tokensUsed": "unknown",
      "responseType": "message",
      "contentLength": 35,
      "duration": "6ms"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

  console.warn
    [2025-06-04T21:03:49.006Z] [WARN] No function call received

      52 |     
      53 |     // Log the message
    > 54 |     consoleMethod(formattedMessage);
         |     ^
      55 |     
      56 |     // Log metadata if provided
      57 |     if (metadata) {

      at Function.consoleMethod [as log] (services/logService.js:54:5)
      at Function.log [as warn] (services/logService.js:81:16)
      at warn (routes/openai.js:864:18)

  console.log
    
    ====================================================================================================

      at Function.log (services/logService.js:35:17)

  console.log
    [2025-06-04T21:03:49.007Z] [MCP] ✅ POST /api/openai/chat  400  - 11ms - MCP RESPONSE

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    ====================================================================================================

      at Function.log (services/logService.js:67:15)

FAIL tests/unit/openai-integration.test.js
  OpenAI Integration Tests
    ✕ OpenAI chat endpoint should require authentication (42 ms)
    ✓ OpenAI chat endpoint should validate request body (21 ms)
    ✕ OpenAI chat endpoint should process a valid request (17 ms)
    ✕ OpenAI chat endpoint should handle function definitions (18 ms)
  OpenAI Integration Schema Tests
    ✓ MCP function schemas are valid for OpenAI (2 ms)
    ✓ OpenAI API key validation logic works correctly
    ✓ Response handlers correctly process different OpenAI formats

  ● OpenAI Integration Tests › OpenAI chat endpoint should require authentication

    listen EADDRINUSE: address already in use :::3001

      277 | const PORT = process.env.PORT || 3001;
      278 |
    > 279 | app.listen(PORT, () => {
          |     ^
      280 |   LogService.info(`===== SERVER STARTED =====`);
      281 |   LogService.info(`Server running on port ${PORT}`);
      282 |   LogService.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

      at Function.listen (node_modules/express/lib/application.js:635:24)
      at Object.listen (server.js:279:5)
      at Object.require (tests/unit/openai-integration.test.js:7:13)

  ● OpenAI Integration Tests › OpenAI chat endpoint should process a valid request

    expect(received).toBe(expected) // Object.is equality

    Expected: 200
    Received: 400

      90 |       });
      91 |
    > 92 |     expect(response.status).toBe(200);
         |                             ^
      93 |     expect(response.body).toHaveProperty('content', 'This is a mock response from the AI');
      94 |     expect(response.body).toHaveProperty('role', 'assistant');
      95 |   });

      at Object.toBe (tests/unit/openai-integration.test.js:92:29)

  ● OpenAI Integration Tests › OpenAI chat endpoint should handle function definitions

    expect(received).toBe(expected) // Object.is equality

    Expected: 200
    Received: 400

      123 |       });
      124 |
    > 125 |     expect(response.status).toBe(200);
          |                             ^
      126 |   });
      127 | });
      128 |

      at Object.toBe (tests/unit/openai-integration.test.js:125:29)

  console.log
    Loaded 35 refresh tokens

      at Object.log (auth/tokenService.js:26:13)

  console.log
    Loaded 35 refresh tokens

      at Object.log (auth/tokenService.js:26:13)

  console.log
    [2025-06-04T21:03:49.558Z] [INFO] OpenAI client initialized

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.559Z] [INFO] OpenAI client initialized

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.577Z] [INFO] Initializing server...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.579Z] [INFO] Verifying data files...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.579Z] [INFO] Initializing server...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.580Z] [INFO] Verifying data files...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.579Z] [DEBUG] Attempting to directly read borrowers.json...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.580Z] [DEBUG] Attempting to directly read borrowers.json...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.582Z] [DEBUG] Borrower B001 found in borrowers.json

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.583Z] [DEBUG] Borrower B001 found in borrowers.json

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrower_id": "B001",
      "first_name": "John",
      "last_name": "Doe",
      "address": "123 Farm Rd, Smalltown, USA",
      "phone": "555-1234",
      "email": "john@example.com",
      "credit_score": 750,
      "income": 100000,
      "farm_size": 500,
      "farm_type": "Crop"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    {
      "borrower_id": "B001",
      "first_name": "John",
      "last_name": "Doe",
      "address": "123 Farm Rd, Smalltown, USA",
      "phone": "555-1234",
      "email": "john@example.com",
      "credit_score": 750,
      "income": 100000,
      "farm_size": 500,
      "farm_type": "Crop"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:49.584Z] [INFO] Borrowers data verified successfully

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.584Z] [INFO] Borrowers data verified successfully

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrowerCount": 10,
      "b001Found": true
    }

      at Function.log (services/logService.js:59:17)

  console.log
    {
      "borrowerCount": 10,
      "b001Found": true
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:49.586Z] [INFO] Registering API routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.586Z] [INFO] Registering API routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.587Z] [INFO] Auth routes registered at /api/auth

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.588Z] [INFO] Registering feature routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.588Z] [INFO] Auth routes registered at /api/auth

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.588Z] [INFO] Registering feature routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.589Z] [INFO] Loan routes registered at /api/loans

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.588Z] [INFO] Loan routes registered at /api/loans

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.589Z] [INFO] Borrower routes registered at /api/borrowers

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.589Z] [INFO] Borrower routes registered at /api/borrowers

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.589Z] [INFO] Risk routes registered at /api/risk

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.589Z] [INFO] Risk routes registered at /api/risk

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.590Z] [INFO] Analytics routes registered at /api/analytics

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.590Z] [INFO] Analytics routes registered at /api/analytics

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.590Z] [INFO] OpenAI routes registered at /api/openai

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.591Z] [INFO] Collateral routes registered at /api/collateral

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.591Z] [INFO] OpenAI routes registered at /api/openai

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.591Z] [INFO] Collateral routes registered at /api/collateral

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.591Z] [INFO] Payment routes registered at /api/payments

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.592Z] [INFO] Payment routes registered at /api/payments

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.619Z] [INFO] MCP server tools configured

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:49.620Z] [INFO] MCP server tools configured

      at Function.consoleMethod [as log] (services/logService.js:54:5)

node:events:485
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::3001
    at Server.setupListenHandle [as _listen2] (node:net:1939:16)
    at listenInCluster (node:net:1996:12)
    at Server.listen (node:net:2101:7)
    at Function.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/express/lib/application.js:635:24)
    at Object.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:279:5)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
    at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/integration/api-flow.test.js:2:16)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
    at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
    at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1975:8)
    at processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'EADDRINUSE',
  errno: -48,
  syscall: 'listen',
  address: '::',
  port: 3001
}

Node.js v23.11.0
node:events:485
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::3001
    at Server.setupListenHandle [as _listen2] (node:net:1939:16)
    at listenInCluster (node:net:1996:12)
    at Server.listen (node:net:2101:7)
    at Function.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/express/lib/application.js:635:24)
    at Object.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:279:5)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
    at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/integration/api.test.js:2:16)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
    at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
    at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1975:8)
    at processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'EADDRINUSE',
  errno: -48,
  syscall: 'listen',
  address: '::',
  port: 3001
}

Node.js v23.11.0
  console.log
    Loaded 35 refresh tokens

      at Object.log (auth/tokenService.js:26:13)

  console.log
    Loaded 35 refresh tokens

      at Object.log (auth/tokenService.js:26:13)

  console.log
    [2025-06-04T21:03:50.224Z] [INFO] OpenAI client initialized

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.228Z] [INFO] OpenAI client initialized

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.245Z] [INFO] Initializing server...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.246Z] [INFO] Verifying data files...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.249Z] [INFO] Initializing server...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.247Z] [DEBUG] Attempting to directly read borrowers.json...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.250Z] [INFO] Verifying data files...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.250Z] [DEBUG] Borrower B001 found in borrowers.json

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrower_id": "B001",
      "first_name": "John",
      "last_name": "Doe",
      "address": "123 Farm Rd, Smalltown, USA",
      "phone": "555-1234",
      "email": "john@example.com",
      "credit_score": 750,
      "income": 100000,
      "farm_size": 500,
      "farm_type": "Crop"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:50.251Z] [INFO] Borrowers data verified successfully

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.250Z] [DEBUG] Attempting to directly read borrowers.json...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrowerCount": 10,
      "b001Found": true
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:50.253Z] [DEBUG] Borrower B001 found in borrowers.json

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrower_id": "B001",
      "first_name": "John",
      "last_name": "Doe",
      "address": "123 Farm Rd, Smalltown, USA",
      "phone": "555-1234",
      "email": "john@example.com",
      "credit_score": 750,
      "income": 100000,
      "farm_size": 500,
      "farm_type": "Crop"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:50.254Z] [INFO] Registering API routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.255Z] [INFO] Borrowers data verified successfully

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.256Z] [INFO] Auth routes registered at /api/auth

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrowerCount": 10,
      "b001Found": true
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:50.256Z] [INFO] Registering feature routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.257Z] [INFO] Loan routes registered at /api/loans

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.257Z] [INFO] Borrower routes registered at /api/borrowers

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.257Z] [INFO] Risk routes registered at /api/risk

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.258Z] [INFO] Analytics routes registered at /api/analytics

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.257Z] [INFO] Registering API routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.258Z] [INFO] OpenAI routes registered at /api/openai

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.258Z] [INFO] Auth routes registered at /api/auth

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.258Z] [INFO] Collateral routes registered at /api/collateral

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.259Z] [INFO] Registering feature routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.259Z] [INFO] Payment routes registered at /api/payments

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.259Z] [INFO] Loan routes registered at /api/loans

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.260Z] [INFO] Borrower routes registered at /api/borrowers

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.260Z] [INFO] Risk routes registered at /api/risk

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.261Z] [INFO] Analytics routes registered at /api/analytics

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.261Z] [INFO] OpenAI routes registered at /api/openai

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.262Z] [INFO] Collateral routes registered at /api/collateral

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.262Z] [INFO] Payment routes registered at /api/payments

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.285Z] [INFO] MCP server tools configured

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.287Z] [INFO] MCP server tools configured

      at Function.consoleMethod [as log] (services/logService.js:54:5)

node:events:485
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::3001
    at Server.setupListenHandle [as _listen2] (node:net:1939:16)
    at listenInCluster (node:net:1996:12)
    at Server.listen (node:net:2101:7)
    at Function.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/express/lib/application.js:635:24)
    at Object.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:279:5)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
    at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/integration/api-flow.test.js:2:16)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
    at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
    at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1975:8)
    at processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'EADDRINUSE',
  errno: -48,
  syscall: 'listen',
  address: '::',
  port: 3001
}

Node.js v23.11.0
node:events:485
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::3001
    at Server.setupListenHandle [as _listen2] (node:net:1939:16)
    at listenInCluster (node:net:1996:12)
    at Server.listen (node:net:2101:7)
    at Function.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/express/lib/application.js:635:24)
    at Object.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:279:5)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
    at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/integration/api.test.js:2:16)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
    at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
    at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1975:8)
    at processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'EADDRINUSE',
  errno: -48,
  syscall: 'listen',
  address: '::',
  port: 3001
}

Node.js v23.11.0
  console.log
    Loaded 35 refresh tokens

      at Object.log (auth/tokenService.js:26:13)

  console.log
    Loaded 35 refresh tokens

      at Object.log (auth/tokenService.js:26:13)

  console.log
    [2025-06-04T21:03:50.884Z] [INFO] OpenAI client initialized

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.887Z] [INFO] OpenAI client initialized

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.905Z] [INFO] Initializing server...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.906Z] [INFO] Verifying data files...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.907Z] [DEBUG] Attempting to directly read borrowers.json...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.909Z] [INFO] Initializing server...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.909Z] [DEBUG] Borrower B001 found in borrowers.json

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.910Z] [INFO] Verifying data files...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrower_id": "B001",
      "first_name": "John",
      "last_name": "Doe",
      "address": "123 Farm Rd, Smalltown, USA",
      "phone": "555-1234",
      "email": "john@example.com",
      "credit_score": 750,
      "income": 100000,
      "farm_size": 500,
      "farm_type": "Crop"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:50.911Z] [INFO] Borrowers data verified successfully

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrowerCount": 10,
      "b001Found": true
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:50.910Z] [DEBUG] Attempting to directly read borrowers.json...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.914Z] [DEBUG] Borrower B001 found in borrowers.json

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrower_id": "B001",
      "first_name": "John",
      "last_name": "Doe",
      "address": "123 Farm Rd, Smalltown, USA",
      "phone": "555-1234",
      "email": "john@example.com",
      "credit_score": 750,
      "income": 100000,
      "farm_size": 500,
      "farm_type": "Crop"
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:50.914Z] [INFO] Registering API routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.916Z] [INFO] Borrowers data verified successfully

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.916Z] [INFO] Auth routes registered at /api/auth

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.916Z] [INFO] Registering feature routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    {
      "borrowerCount": 10,
      "b001Found": true
    }

      at Function.log (services/logService.js:59:17)

  console.log
    [2025-06-04T21:03:50.917Z] [INFO] Loan routes registered at /api/loans

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.917Z] [INFO] Borrower routes registered at /api/borrowers

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.918Z] [INFO] Risk routes registered at /api/risk

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.918Z] [INFO] Analytics routes registered at /api/analytics

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.918Z] [INFO] OpenAI routes registered at /api/openai

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.919Z] [INFO] Collateral routes registered at /api/collateral

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.918Z] [INFO] Registering API routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.919Z] [INFO] Payment routes registered at /api/payments

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.920Z] [INFO] Auth routes registered at /api/auth

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.920Z] [INFO] Registering feature routes...

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.921Z] [INFO] Loan routes registered at /api/loans

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.921Z] [INFO] Borrower routes registered at /api/borrowers

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.922Z] [INFO] Risk routes registered at /api/risk

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.922Z] [INFO] Analytics routes registered at /api/analytics

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.923Z] [INFO] OpenAI routes registered at /api/openai

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.923Z] [INFO] Collateral routes registered at /api/collateral

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.924Z] [INFO] Payment routes registered at /api/payments

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.955Z] [INFO] MCP server tools configured

      at Function.consoleMethod [as log] (services/logService.js:54:5)

  console.log
    [2025-06-04T21:03:50.958Z] [INFO] MCP server tools configured

      at Function.consoleMethod [as log] (services/logService.js:54:5)

node:events:485
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::3001
    at Server.setupListenHandle [as _listen2] (node:net:1939:16)
    at listenInCluster (node:net:1996:12)
    at Server.listen (node:net:2101:7)
    at Function.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/express/lib/application.js:635:24)
    at Object.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:279:5)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
    at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/integration/api-flow.test.js:2:16)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
    at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
    at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1975:8)
    at processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'EADDRINUSE',
  errno: -48,
  syscall: 'listen',
  address: '::',
  port: 3001
}

Node.js v23.11.0
node:events:485
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::3001
    at Server.setupListenHandle [as _listen2] (node:net:1939:16)
    at listenInCluster (node:net:1996:12)
    at Server.listen (node:net:2101:7)
    at Function.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/express/lib/application.js:635:24)
    at Object.listen (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/server.js:279:5)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at Runtime.requireModuleOrMock (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1048:21)
    at Object.require (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/tests/integration/api.test.js:2:16)
    at Runtime._execModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1439:24)
    at Runtime._loadModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:1022:12)
    at Runtime.requireModule (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runtime/build/index.js:882:12)
    at jestAdapter (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:77:13)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at runTestInternal (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:367:16)
    at runTest (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/runTest.js:444:34)
    at Object.worker (/Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/jest-runner/build/testWorker.js:106:12)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1975:8)
    at processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'EADDRINUSE',
  errno: -48,
  syscall: 'listen',
  address: '::',
  port: 3001
}

Node.js v23.11.0
FAIL tests/integration/api-flow.test.js
  ● Test suite failed to run

    Jest worker encountered 4 child process exceptions, exceeding retry limit

      at ChildProcessWorker.initialize (node_modules/jest-worker/build/workers/ChildProcessWorker.js:181:21)

FAIL tests/integration/api.test.js
  ● Test suite failed to run

    Jest worker encountered 4 child process exceptions, exceeding retry limit

      at ChildProcessWorker.initialize (node_modules/jest-worker/build/workers/ChildProcessWorker.js:181:21)

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
-----------------------------------|---------|----------|---------|---------|----------------------------------------------------------------------------------------------
File                               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                                                            
-----------------------------------|---------|----------|---------|---------|----------------------------------------------------------------------------------------------
All files                          |   13.03 |     6.57 |     7.2 |   14.16 |                                                                                              
 server                            |   16.05 |     4.67 |    4.25 |   16.39 |                                                                                              
  server.js                        |   56.45 |    16.66 |    12.5 |   56.45 | 41-43,64-65,77-78,83-129,140-172,199-205,209,245-246,255-256,260,264,269-270,280-286,291-293 
  test-borrower-risk.js            |       0 |        0 |       0 |       0 | 4-254                                                                                        
  test-collateral-sufficiency.js   |       0 |        0 |       0 |       0 | 4-127                                                                                        
  test-default-risk.js             |       0 |        0 |       0 |       0 | 4-152                                                                                        
  test-high-risk-farmers.js        |       0 |        0 |       0 |       0 | 4-148                                                                                        
  test-logging.js                  |       0 |        0 |       0 |       0 | 5-111                                                                                        
 server/auth                       |   30.95 |    12.82 |    7.14 |   31.86 |                                                                                              
  authController.js                |   11.53 |        0 |       0 |   11.53 | 15-74,87-141,154-171                                                                         
  authMiddleware.js                |   35.71 |    21.87 |      20 |   35.71 | 19-24,42,63-76,86-105,118-147                                                                
  authRoutes.js                    |      90 |      100 |       0 |      90 | 37                                                                                           
  config.js                        |     100 |      100 |     100 |     100 |                                                                                              
  tokenService.js                  |      40 |       10 |   14.28 |   40.74 | 29,35-42,53-66,75-87,95-96,105,126,132-144                                                   
  userService.js                   |      24 |        0 |       0 |   26.66 | 15-25,34-37,47-48,57-58,68,77-106,114-119,129-132                                            
 server/mcp                        |    6.37 |        0 |    7.69 |    7.42 |                                                                                              
  server.js                        |    6.37 |        0 |    7.69 |    7.42 | 27-133,154-254,275-386,406-471                                                               
 server/middleware                 |   54.54 |    35.48 |      60 |   54.54 |                                                                                              
  errorHandler.js                  |    37.5 |        0 |       0 |    37.5 | 9-25                                                                                         
  logger.js                        |       0 |      100 |       0 |       0 | 5-11                                                                                         
  requestLogger.js                 |    90.9 |       75 |     100 |    90.9 | 16                                                                                           
  tenantMiddleware.js              |      55 |    47.05 |     100 |      55 | 21,26-29,34,47,55-62                                                                         
 server/routes                     |    5.45 |     1.87 |    0.55 |    6.16 |                                                                                              
  analytics.js                     |    1.95 |        0 |       0 |    2.23 | 8-195,204-343,348-458,463-659,668-787,792-925,931-1128,1134-1307,1313-1533                   
  borrowers.js                     |   13.23 |        0 |       0 |   14.28 | 8-29,35-98,104-118,124-153                                                                   
  collateral.js                    |      30 |        0 |       0 |   31.57 | 7-10,15-26                                                                                   
  loans.js                         |    8.19 |        0 |       0 |    9.03 | 9-55,60-84,90-130,136-152,158-190,199-247,253-284,290-301,307-318                            
  openai.js                        |   10.69 |    11.57 |    4.76 |   10.95 | 11-57,416-861,868-869                                                                        
  payments.js                      |      30 |        0 |       0 |   31.57 | 7-11,16-27                                                                                   
  risk.js                          |    3.22 |        0 |       0 |    3.98 | 8-117,122-247,252-353,358-470                                                                
 server/services                   |   43.82 |    32.83 |   42.42 |   44.34 |                                                                                              
  dataService.js                   |   26.56 |    10.76 |   23.07 |   26.82 | 22-29,40-41,47-48,54-55,70-82,88-131,137-305,311,317-322                                     
  logService.js                    |   85.45 |    59.57 |   88.88 |   85.45 | 61,117,140,142,152-171                                                                       
  mcpService.js                    |    7.69 |        0 |       0 |    7.69 | 17-96                                                                                        
  openaiService.js                 |   76.92 |    56.25 |     100 |   76.92 | 11-12,55,73-85                                                                               
 server/templates                  |       0 |        0 |       0 |       0 |                                                                                              
  mcp-function-handler-template.js |       0 |      100 |     100 |       0 | 88                                                                                           
  mcp-function-test-template.js    |       0 |        0 |       0 |       0 | 12-145                                                                                       
 server/utils                      |    1.61 |        0 |       0 |    1.69 |                                                                                              
  validation.js                    |    1.61 |        0 |       0 |    1.69 | 7-164                                                                                        
-----------------------------------|---------|----------|---------|---------|----------------------------------------------------------------------------------------------
Summary of all failing tests
FAIL tests/unit/auth-implementation.test.js
  ● Test suite failed to run

    TypeError: path.resolve is not a function

      3 |  * Tests for the implemented authentication flow in the MCP POC
      4 |  */
    > 5 | const bcrypt = require('bcrypt');
        |                ^
      6 | const jwt = require('jsonwebtoken');
      7 |
      8 | // Mock fs and path modules to avoid actual file operations

      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:49)
      at Object.require (tests/unit/auth-implementation.test.js:5:16)

FAIL tests/unit/loan-details.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/loan-details.test.js:9:16)

FAIL tests/unit/api.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/api.test.js:12:16)

FAIL tests/unit/edge-cases.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/edge-cases.test.js:9:16)

FAIL tests/unit/loan-summary.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/loan-summary.test.js:9:16)

FAIL tests/unit/data-loading.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/data-loading.test.js:13:16)

FAIL tests/unit/final-coverage.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/final-coverage.test.js:14:16)

FAIL tests/integration/auth-data-retrieval.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/integration/auth-data-retrieval.test.js:6:13)

FAIL tests/unit/data-service.test.js
  ● Test suite failed to run

    No native build was found for platform=darwin arch=x64 runtime=node abi=131 uv=1 libc=glibc node=23.11.0
        loaded from: /Users/spehargreg/Development/LoanOfficerAI-MCP-POC/server/node_modules/bcrypt

      4 | const fs = require('fs');
      5 | const path = require('path');
    > 6 | const bcrypt = require('bcrypt');
        |                ^
      7 |
      8 | const usersPath = path.join(__dirname, '../data/users.json');
      9 |

      at Function.Object.<anonymous>.load.resolve.load.path (node_modules/node-gyp-build/node-gyp-build.js:60:9)
      at load (node_modules/node-gyp-build/node-gyp-build.js:22:30)
      at Object.<anonymous> (node_modules/bcrypt/bcrypt.js:2:43)
      at Object.require (auth/userService.js:6:16)
      at Object.require (auth/authMiddleware.js:6:21)
      at Object.require (server.js:18:24)
      at Object.require (tests/unit/data-service.test.js:14:16)

FAIL tests/integration/auth-api.test.js
  ● Test suite failed to run

    OpenAI API key is not configured

      10 |     if (!process.env.OPENAI_API_KEY) {
      11 |       LogService.error('OPENAI_API_KEY environment variable is not set');
    > 12 |       throw new Error('OpenAI API key is not configured');
         |             ^
      13 |     }
      14 |     
      15 |     this.client = new OpenAI({

      at new OpenAIService (services/openaiService.js:12:13)
      at Object.<anonymous> (services/openaiService.js:91:18)
      at Object.require (routes/openai.js:5:23)
      at Object.require (server.js:27:22)
      at Object.require (tests/integration/auth-api.test.js:12:13)

FAIL tests/unit/openai-integration.test.js
  ● OpenAI Integration Tests › OpenAI chat endpoint should require authentication

    listen EADDRINUSE: address already in use :::3001

      277 | const PORT = process.env.PORT || 3001;
      278 |
    > 279 | app.listen(PORT, () => {
          |     ^
      280 |   LogService.info(`===== SERVER STARTED =====`);
      281 |   LogService.info(`Server running on port ${PORT}`);
      282 |   LogService.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

      at Function.listen (node_modules/express/lib/application.js:635:24)
      at Object.listen (server.js:279:5)
      at Object.require (tests/unit/openai-integration.test.js:7:13)

  ● OpenAI Integration Tests › OpenAI chat endpoint should process a valid request

    expect(received).toBe(expected) // Object.is equality

    Expected: 200
    Received: 400

      90 |       });
      91 |
    > 92 |     expect(response.status).toBe(200);
         |                             ^
      93 |     expect(response.body).toHaveProperty('content', 'This is a mock response from the AI');
      94 |     expect(response.body).toHaveProperty('role', 'assistant');
      95 |   });

      at Object.toBe (tests/unit/openai-integration.test.js:92:29)

  ● OpenAI Integration Tests › OpenAI chat endpoint should handle function definitions

    expect(received).toBe(expected) // Object.is equality

    Expected: 200
    Received: 400

      123 |       });
      124 |
    > 125 |     expect(response.status).toBe(200);
          |                             ^
      126 |   });
      127 | });
      128 |

      at Object.toBe (tests/unit/openai-integration.test.js:125:29)

FAIL tests/integration/api-flow.test.js
  ● Test suite failed to run

    Jest worker encountered 4 child process exceptions, exceeding retry limit

      at ChildProcessWorker.initialize (node_modules/jest-worker/build/workers/ChildProcessWorker.js:181:21)

FAIL tests/integration/api.test.js
  ● Test suite failed to run

    Jest worker encountered 4 child process exceptions, exceeding retry limit

      at ChildProcessWorker.initialize (node_modules/jest-worker/build/workers/ChildProcessWorker.js:181:21)


Test Suites: 13 failed, 6 skipped, 5 passed, 18 of 24 total
Tests:       3 failed, 69 skipped, 26 passed, 98 total
Snapshots:   0 total
Time:        5.464 s
Ran all test suites.
