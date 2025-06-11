# MCP Made Simple

Hi there! This guide explains how our Model Completion Protocol (MCP) works in a way that's easy to understand. Think of MCP as a translator between our app and the AI!

## 1. Login and Data Loading

### What Happens When You Log In?

When you open our app and type your username and password, here's what happens behind the scenes:

1. **You click the login button** - Your username and password travel from your computer to our server
2. **The server checks your password** - Our server makes sure you're really you
3. **The server uses MCP to get your stuff** - MCP helps collect all your information
4. **Your information comes back to your screen** - Everything you need appears like magic!

### How It Works (Behind the Curtain)

```javascript
// On your computer (the client)
function loginButton() {
  // When you click login, this happens:
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Send your login info to the server
  mcpClient.execute("loginUser", {
    username: username,
    password: password,
  });
}

// On the server
const loginUser = {
  name: "loginUser",
  description: "Log in a user and return their data",
  parameters: {
    // This describes what information is needed
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
    // Check if password is correct
    const user = await db.users.findOne({ username: args.username });
    if (!user || !checkPassword(args.password, user.passwordHash)) {
      throw new Error("Wrong username or password");
    }

    // Get all the user's information using MCP functions
    const loans = await mcpService.executeFunction("getUserLoans", {
      userId: user.id,
    });
    const notifications = await mcpService.executeFunction(
      "getUserNotifications",
      { userId: user.id }
    );

    // Send everything back to the user's computer
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      loans: loans,
      notifications: notifications,
    };
  },
};
```

### How to Set This Up

1. **Server Setup**: Add your MCP function to the server's list of functions
2. **Client Setup**: Create a login form and use the MCP client to call the function

## 2. Getting Loan Details with AI

### What Happens When You Ask for Loan Details?

Let's say you want to see details about a loan. Here's what happens:

1. **You click "View Loan Details"** - Your request goes to the AI
2. **The AI understands what you want** - It figures out you want loan information
3. **The AI uses MCP to get the loan details** - MCP helps the AI talk to our database
4. **The loan details appear on your screen** - You see all the information you wanted!

### How It Works (Behind the Curtain)

```javascript
// On your computer (with AI)
async function askAI(userQuestion) {
  // Send your question to the AI
  const response = await fetch("/api/ai", {
    method: "POST",
    body: JSON.stringify({ question: userQuestion }),
  });

  const aiResponse = await response.json();

  // If the AI wants to use an MCP function
  if (aiResponse.functionCall) {
    // Use MCP to get loan details
    const result = await mcpClient.execute(
      aiResponse.functionCall.name,
      aiResponse.functionCall.arguments
    );

    // Show the result on the screen
    displayResult(result);
  }
}

// On the server
const getLoanDetails = {
  name: "getLoanDetails",
  description: "Get details about a specific loan",
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
    // Find the loan in our database
    const loan = await db.loans.findOne({ id: args.loanId });

    if (!loan) {
      throw new Error("Loan not found");
    }

    // Return all the loan information
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

### How to Set This Up

1. **Server Setup**: Add the loan details function to your MCP functions list
2. **Client Setup**: Add a way for users to ask questions and display answers
3. **AI Setup**: Configure the AI to use your MCP functions when needed

## 3. Testing AI Functions

### How to Test If Everything Works

Testing is like doing a practice run to make sure everything works before the real game. Here's how we test our MCP functions:

1. **Write a test for each function** - Create small programs that check if functions work
2. **Run tests automatically** - Set up a system to run all tests when code changes
3. **Fix problems before users see them** - If tests find issues, fix them right away

### Example Test for Loan Details

```javascript
// test-loan-details.js
const mcpService = require("../services/mcpService");
const db = require("../services/dataService");

// This is a test function
async function testGetLoanDetails() {
  // 1. SETUP - Create a fake loan for testing
  const fakeLoan = {
    id: "test-loan-123",
    amount: 10000,
    interestRate: 5.5,
    term: 36,
    monthlyPayment: 301.96,
    startDate: "2023-01-15",
    status: "active",
  };

  // Add the fake loan to a test database
  await db.loans.insertOne(fakeLoan);

  // 2. TEST - Call the function we want to test
  const result = await mcpService.executeFunction("getLoanDetails", {
    loanId: "test-loan-123",
  });

  // 3. CHECK - Make sure we got the right information back
  if (result.id !== "test-loan-123") {
    console.error("Test failed: Wrong loan ID returned");
    return false;
  }

  if (result.amount !== 10000) {
    console.error("Test failed: Wrong loan amount returned");
    return false;
  }

  // Check other fields...

  // 4. CLEANUP - Remove the fake loan from the test database
  await db.loans.deleteOne({ id: "test-loan-123" });

  console.log("Test passed: getLoanDetails works correctly!");
  return true;
}

// Run the test
testGetLoanDetails();
```

### Setting Up Automatic Testing with GitHub

To make tests run automatically when you push code to GitHub:

1. **Create a test script** - Put all your tests in a folder
2. **Add a GitHub Actions workflow file** - Create a file that tells GitHub when to run tests

```yaml
# .github/workflows/test.yml
name: Run MCP Tests

# This tells GitHub when to run tests
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
        uses: actions/setup-node@v2
        with:
          node-version: "14"

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test
```

### How to Run Tests Yourself

If you want to test things before pushing to GitHub:

1. Open the terminal on your computer
2. Type `npm test` and press Enter
3. Watch for any errors and fix them

That's it! Now you understand how our MCP system helps with logging in, getting loan details with AI, and making sure everything works properly through testing.
