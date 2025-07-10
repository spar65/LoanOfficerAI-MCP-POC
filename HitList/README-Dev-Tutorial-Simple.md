# MCP Made Simple

Hi there! This guide explains how our MCP (Model Completion Protocol) system works in simple terms. Think of MCP as a special language that helps different parts of our app talk to each other - especially when we want to use AI to help with tasks.

## Example 1: Login and Loading Your Data

### What Happens When You Log In?

Imagine you're entering a building with a security. Here's how MCP works when you log in:

1. **You enter your username and password** on the login screen.
2. **Your computer sends this information** to our server using MCP.
3. **The server checks if your information is correct**. This is like the security checking your ID.
4. **If correct, the server sends back a special ticket** (we call it a "token").
5. **The server also sends important data** you'll need right away.

### How We Set This Up

#### On the Server Side:

```javascript
// This is our login function
const loginFunction = {
  name: "login",
  description: "Log in a user and return their data",
  parameters: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "User's username",
      },
      password: {
        type: "string",
        description: "User's password",
      },
    },
    required: ["username", "password"],
  },
  handler: async (args) => {
    const { username, password } = args;

    // Check if username and password are correct
    const user = await checkUserCredentials(username, password);

    if (!user) {
      throw new Error("Wrong username or password");
    }

    // Create special ticket (token)
    const token = createAuthToken(user.id);

    // Get important data user needs right away
    const userData = await getUserData(user.id);
    const recentLoans = await getRecentLoans(user.id);

    // Return everything the user needs to get started
    return {
      token: token,
      user: userData,
      recentLoans: recentLoans,
    };
  },
};
```

#### On Your Computer (Client Side):

```javascript
// When you click the login button
async function handleLogin() {
  // Get what you typed in the username and password boxes
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    // Send to server using MCP
    const result = await mcpClient.execute("login", {
      username: username,
      password: password,
    });

    // Save your special ticket (token)
    localStorage.setItem("authToken", result.token);

    // Save user data we got back
    saveUserData(result.user);
    displayRecentLoans(result.recentLoans);

    // Go to main page
    navigateToDashboard();
  } catch (error) {
    // Show error message if something went wrong
    showErrorMessage("Login failed: " + error.message);
  }
}
```

## Example 2: Getting Loan Details with AI

Let's say you want to see details about a loan, and you want AI to help explain it in simple terms.

### How It Works:

1. **You click on a loan** in your list.
2. **Your computer asks the server** for details about that loan using MCP.
3. **The server sends back the loan information**.
4. **Your computer then asks the AI** to explain this information in simple terms.
5. **The AI uses MCP functions** to get any extra information it needs.
6. **You see the loan details and simple explanation** on your screen.

### How We Set This Up

#### On the Server Side:

```javascript
// Function to get loan details
const getLoanDetailsFunction = {
  name: "getLoanDetails",
  description: "Get detailed information about a loan",
  parameters: {
    type: "object",
    properties: {
      loanId: {
        type: "string",
        description: "The ID of the loan",
      },
    },
    required: ["loanId"],
  },
  handler: async (args) => {
    const { loanId } = args;

    // Find the loan in our database
    const loan = await findLoanById(loanId);

    if (!loan) {
      throw new Error("Loan not found");
    }

    // Return all the loan details
    return {
      id: loan.id,
      amount: loan.amount,
      interestRate: loan.interestRate,
      term: loan.term,
      monthlyPayment: loan.monthlyPayment,
      startDate: loan.startDate,
      status: loan.status,
    };
  },
};
```

#### On Your Computer (Client Side):

```javascript
// When you click on a loan
async function showLoanDetails(loanId) {
  try {
    // Step 1: Get loan details from server using MCP
    const loanDetails = await mcpClient.execute("getLoanDetails", {
      loanId: loanId,
    });

    // Step 2: Display the loan details on screen
    displayLoanInfo(loanDetails);

    // Step 3: Ask AI to explain the loan in simple terms
    const aiExplanation = await askAI(
      "Please explain this loan in simple terms:",
      loanDetails,
      // Give AI access to these MCP functions if it needs more info
      ["getLoanDetails", "getPaymentSchedule", "calculateRemainingBalance"]
    );

    // Step 4: Show the AI explanation
    displayAIExplanation(aiExplanation);
  } catch (error) {
    showErrorMessage("Couldn't get loan details: " + error.message);
  }
}
```

## Example 3: Testing Our AI Functions

We need to make sure our MCP functions work correctly every time we change our code. Here's how we test them:

### How Testing Works:

1. **We write special test files** for each MCP function.
2. **These tests try using the function** with different inputs.
3. **The tests check if the function gives the right answers**.
4. **We run these tests automatically** whenever we upload new code.

### Setting Up Tests

#### Step 1: Create a Test File

```javascript
// File: test-loan-details.js

// Import testing tools
const { expect } = require("chai");
const mcpService = require("../services/mcpService");

// Describe our tests
describe("Loan Details Function", () => {
  // Test getting a valid loan
  it("should return loan details when given a valid loan ID", async () => {
    // Run the function with a test loan ID
    const result = await mcpService.executeFunction("getLoanDetails", {
      loanId: "test-loan-123",
    });

    // Check if we got the right information back
    expect(result).to.have.property("amount");
    expect(result).to.have.property("interestRate");
    expect(result).to.have.property("term");
    expect(result).to.have.property("monthlyPayment");
  });

  // Test with a loan that doesn't exist
  it("should throw an error for non-existent loan ID", async () => {
    try {
      // Try to get a loan that doesn't exist
      await mcpService.executeFunction("getLoanDetails", {
        loanId: "fake-loan-999",
      });

      // If we get here, the test failed
      throw new Error("Expected function to throw an error but it did not");
    } catch (error) {
      // Check if we got the right error message
      expect(error.message).to.include("Loan not found");
    }
  });
});
```

#### Step 2: Set Up Automatic Testing

We use a special file called `.github/workflows/test.yml` to automatically run tests when we upload new code:

```yaml
name: Run MCP Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v1
        with:
          node-version: "16"

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test
```

#### Step 3: Run Tests Yourself

To run the tests on your own computer:

1. Open a command window
2. Type `npm test` and press Enter
3. Watch for green check marks (tests passed) or red X's (tests failed)

### Why Testing Is Important

Imagine you're building something. Testing is like making sure each piece fits correctly before you add the next one. This helps us:

- Catch mistakes early
- Make sure AI functions work correctly
- Keep our app working well when we add new features

That's it! Now you understand how MCP works with login, getting loan details, and testing.
