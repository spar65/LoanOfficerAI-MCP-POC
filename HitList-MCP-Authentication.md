# HitList: MCP Authentication for Multi-Tenant Banking Application

## Overview

This document outlines a comprehensive authentication and security implementation plan for a multi-tenant banking application using MCP. The solution ensures proper tenant isolation, data security, and MCP service protection.

## Phase 1: Core Authentication Implementation

- [x] 1.1 Set up JWT-based authentication

  - [x] 1.1.1 Install required dependencies
    ```bash
    cd loan-chatbot-poc/server
    npm install jsonwebtoken bcrypt cookie-parser
    ```
  - [x] 1.1.2 Create JWT secret and configuration
    ```javascript
    // server/auth/config.js
    module.exports = {
      jwtSecret: process.env.JWT_SECRET || "your-secret-key-for-development",
      jwtExpiresIn: "15m",
      refreshTokenExpiresIn: "7d",
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      },
    };
    ```

- [x] 1.2 Implement authentication controllers

  - [x] 1.2.1 Create login endpoint

    ```javascript
    // server/auth/authController.js
    const jwt = require("jsonwebtoken");
    const bcrypt = require("bcrypt");
    const {
      jwtSecret,
      jwtExpiresIn,
      refreshTokenExpiresIn,
      cookieOptions,
    } = require("./config");
    const {
      generateRefreshToken,
      storeRefreshToken,
    } = require("./tokenService");

    exports.login = async (req, res) => {
      const { username, password } = req.body;

      try {
        // In production, validate against user database
        // For POC: Basic validation with sample users
        const users = require("../users.json");
        const user = users.find((u) => u.username === username);

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Create JWT with user info and tenant ID
        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            tenantId: user.tenantId,
            role: user.role,
          },
          jwtSecret,
          { expiresIn: jwtExpiresIn }
        );

        // Generate refresh token
        const refreshToken = generateRefreshToken(user);
        await storeRefreshToken(refreshToken, user.id);

        // Set refresh token as HTTP-only cookie
        res.cookie("refreshToken", refreshToken, cookieOptions);

        // Send access token as JSON
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            tenantId: user.tenantId,
            role: user.role,
          },
        });
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Authentication failed" });
      }
    };
    ```

- [x] 1.3 Create token service for refresh tokens

  - [x] 1.3.1 Generate and validate refresh tokens

    ```javascript
    // server/auth/tokenService.js
    const jwt = require("jsonwebtoken");
    const crypto = require("crypto");
    const { jwtSecret, refreshTokenExpiresIn } = require("./config");

    // In-memory store for refresh tokens (use Redis or database in production)
    const refreshTokens = new Map();

    exports.generateRefreshToken = (user) => {
      const refreshToken = crypto.randomBytes(40).toString("hex");
      return refreshToken;
    };

    exports.storeRefreshToken = async (token, userId) => {
      refreshTokens.set(token, {
        userId,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    };

    exports.validateRefreshToken = async (token) => {
      const tokenData = refreshTokens.get(token);
      if (!tokenData) return null;

      if (tokenData.expiresAt < Date.now()) {
        refreshTokens.delete(token);
        return null;
      }

      return tokenData;
    };

    exports.invalidateRefreshToken = async (token) => {
      refreshTokens.delete(token);
    };
    ```

- [x] 1.4 Create refresh token endpoint

  - [x] 1.4.1 Implement token refresh

    ```javascript
    // In server/auth/authController.js
    exports.refreshToken = async (req, res) => {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required" });
      }

      try {
        const tokenData = await validateRefreshToken(refreshToken);
        if (!tokenData) {
          return res
            .status(401)
            .json({ message: "Invalid or expired refresh token" });
        }

        // Get user data
        const users = require("../users.json");
        const user = users.find((u) => u.id === tokenData.userId);

        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }

        // Create new access token
        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            tenantId: user.tenantId,
            role: user.role,
          },
          jwtSecret,
          { expiresIn: jwtExpiresIn }
        );

        // Rotate refresh token (create new one)
        await invalidateRefreshToken(refreshToken);
        const newRefreshToken = generateRefreshToken(user);
        await storeRefreshToken(newRefreshToken, user.id);

        // Set new refresh token
        res.cookie("refreshToken", newRefreshToken, cookieOptions);

        // Send new access token
        res.json({ token });
      } catch (error) {
        console.error("Token refresh error:", error);
        res.status(500).json({ message: "Token refresh failed" });
      }
    };
    ```

- [x] 1.5 Create logout endpoint

  - [x] 1.5.1 Implement secure logout

    ```javascript
    // In server/auth/authController.js
    exports.logout = async (req, res) => {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        // Invalidate the refresh token
        await invalidateRefreshToken(refreshToken);
      }

      // Clear the cookie
      res.clearCookie("refreshToken");

      res.json({ message: "Logged out successfully" });
    };
    ```

## Phase 2: Authentication Middleware and Tenant Isolation

- [x] 2.1 Create authentication middleware

  - [x] 2.1.1 Token verification middleware

    ```javascript
    // server/middleware/authMiddleware.js
    const jwt = require("jsonwebtoken");
    const { jwtSecret } = require("../auth/config");

    exports.verifyToken = (req, res, next) => {
      // Get the token from the Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "Access token required" });
      }

      try {
        // Verify the token
        const decoded = jwt.verify(token, jwtSecret);

        // Set the user object on the request
        req.user = decoded;

        next();
      } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
    };
    ```

- [x] 2.2 Create tenant isolation middleware

  - [x] 2.2.1 Tenant verification middleware

    ```javascript
    // server/middleware/tenantMiddleware.js
    exports.verifyTenant = (req, res, next) => {
      // Extract tenant ID from the authenticated user
      const userTenantId = req.user.tenantId;

      if (!userTenantId) {
        return res.status(403).json({ message: "Tenant information missing" });
      }

      // Set tenant context for all database operations
      req.tenantContext = userTenantId;

      // If accessing a specific resource, verify tenant ownership
      if (req.params.id) {
        const resourceId = req.params.id;

        // Check if the requested resource belongs to the user's tenant
        // This is a simplified example - in production, query your database
        const loans = require("../loans.json");
        const loan = loans.find((l) => l.id === resourceId);

        if (!loan || loan.tenantId !== userTenantId) {
          return res.status(403).json({
            message: "Access denied: resource belongs to another tenant",
          });
        }
      }

      next();
    };
    ```

## Phase 3: MCP Client Security Enhancement

- [x] 3.1 Update MCP client with authentication

  - [x] 3.1.1 Add authentication headers to all requests

    ```javascript
    // client/src/mcp/client.js
    import axios from "axios";
    import { refreshToken } from "../auth/authService";

    const mcpClient = {
      baseURL: "http://localhost:3001/api",

      // Get authentication headers for API requests
      getAuthHeaders() {
        const token = localStorage.getItem("accessToken");
        return {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Tenant-ID": JSON.parse(localStorage.getItem("user"))?.tenantId,
        };
      },

      // Handle authentication errors
      async handleAuthError(error, retryCallback) {
        if (error.response?.status === 401) {
          try {
            // Attempt to refresh the token
            const success = await refreshToken();
            if (success) {
              // Retry the original request
              return retryCallback();
            } else {
              // If refresh fails, redirect to login
              window.location.href = "/login";
              return null;
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            window.location.href = "/login";
            return null;
          }
        }
        throw error;
      },

      // Get all loans with authentication
      async getAllLoans() {
        try {
          const response = await axios.get(`${this.baseURL}/loans`, {
            headers: this.getAuthHeaders(),
          });
          return response.data;
        } catch (error) {
          if (error.response?.status === 401) {
            return this.handleAuthError(error, () => this.getAllLoans());
          }
          console.error("Error fetching loans:", error);
          return [];
        }
      },

      // Similar updates for other methods...
      async getLoanStatus(loanId) {
        try {
          const response = await axios.get(
            `${this.baseURL}/loan/status/${loanId}`,
            {
              headers: this.getAuthHeaders(),
            }
          );
          return response.data.status;
        } catch (error) {
          if (error.response?.status === 401) {
            return this.handleAuthError(error, () =>
              this.getLoanStatus(loanId)
            );
          }
          console.error("Error fetching loan status:", error);
          throw error;
        }
      },

      // Other methods similarly updated...
    };

    export default mcpClient;
    ```

- [x] 3.2 Add auth service for handling tokens

  - [x] 3.2.1 Create authentication service

    ```javascript
    // client/src/auth/authService.js
    import axios from "axios";

    const API_URL = "http://localhost:3001/api";

    // Login function
    export const login = async (username, password) => {
      try {
        const response = await axios.post(
          `${API_URL}/auth/login`,
          {
            username,
            password,
          },
          {
            withCredentials: true, // Important for cookies
          }
        );

        const { token, user } = response.data;

        // Store the access token in localStorage
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(user));

        return true;
      } catch (error) {
        console.error("Login failed:", error);
        return false;
      }
    };

    // Refresh token function
    export const refreshToken = async () => {
      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          {
            withCredentials: true, // Important for cookies
          }
        );

        const { token } = response.data;

        // Update the access token in localStorage
        localStorage.setItem("accessToken", token);

        return true;
      } catch (error) {
        console.error("Token refresh failed:", error);
        return false;
      }
    };

    // Logout function
    export const logout = async () => {
      try {
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          {
            withCredentials: true,
          }
        );

        // Clear local storage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        return true;
      } catch (error) {
        console.error("Logout failed:", error);

        // Even if the API call fails, clear local storage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        return false;
      }
    };
    ```

## Phase 4: MCP Server Security Enhancements

- [x] 4.1 Network-level isolation for MCP

  - [x] 4.1.1 Configure allowed origins and service authentication

    ```javascript
    // server/config/mcpConfig.js
    const mcp = require("mcp-server"); // Hypothetical MCP server module

    // Configure MCP with security settings
    mcp.configure({
      allowedOrigins: [
        process.env.MIDDLEWARE_SERVER_ID || "default-middleware-id",
      ],
      requireServiceAuth: true,
      serviceAuthKey: process.env.MCP_SERVICE_KEY || "development-mcp-key",
    });

    module.exports = mcp;
    ```

- [x] 4.2 Tenant context for MCP

  - [x] 4.2.1 Create MCP service wrapper with tenant context

    ```javascript
    // server/services/mcpService.js
    const mcp = require("../config/mcpConfig");

    const mcpService = {
      // Current tenant context
      _tenantContext: null,

      // Set tenant context for subsequent operations
      setTenantContext(tenantId) {
        this._tenantContext = tenantId;

        // Set default headers for MCP requests
        mcp.setDefaultHeaders({
          "X-Tenant-ID": tenantId,
        });
      },

      // Get tenant context
      getTenantContext() {
        return this._tenantContext;
      },

      // MCP operations with tenant context
      async getLoanData(loanId) {
        // Ensure tenant context is set
        if (!this._tenantContext) {
          throw new Error("Tenant context not set");
        }

        return mcp.getLoan(loanId, { tenantId: this._tenantContext });
      },

      // Other MCP operations...
    };

    module.exports = mcpService;
    ```

- [x] 4.3 MCP data encryption

  - [x] 4.3.1 Implement tenant-specific encryption

    ```javascript
    // server/services/encryptionService.js
    const crypto = require("crypto");

    // In production, use a secure key management service
    const getTenantEncryptionKey = (tenantId) => {
      // This is a simplified example - use a proper key derivation in production
      const baseKey = process.env.ENCRYPTION_BASE_KEY || "base-encryption-key";
      return crypto
        .createHash("sha256")
        .update(`${baseKey}:${tenantId}`)
        .digest("hex");
    };

    exports.encryptWithTenantKey = (data, tenantId) => {
      const key = getTenantEncryptionKey(tenantId);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(key, "hex"),
        iv
      );

      let encrypted = cipher.update(JSON.stringify(data));
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      return {
        iv: iv.toString("hex"),
        encryptedData: encrypted.toString("hex"),
      };
    };

    exports.decryptWithTenantKey = (encryptedData, tenantId) => {
      const key = getTenantEncryptionKey(tenantId);
      const iv = Buffer.from(encryptedData.iv, "hex");
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(key, "hex"),
        iv
      );

      let decrypted = decipher.update(
        Buffer.from(encryptedData.encryptedData, "hex")
      );
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return JSON.parse(decrypted.toString());
    };
    ```

- [x] 4.4 MCP audit trail

  - [x] 4.4.1 Implement comprehensive audit logging

    ```javascript
    // server/middleware/auditMiddleware.js
    const { v4: uuidv4 } = require("uuid");

    // In production, use a proper logging service
    const auditLogger = {
      log(entry) {
        console.log("[AUDIT]", JSON.stringify(entry));
        // In production: append to secure audit log or send to logging service
      },
    };

    exports.auditLogger = auditLogger;

    exports.auditMiddleware = (req, res, next) => {
      const requestId = uuidv4();
      req.requestId = requestId;

      // Log the request
      auditLogger.log({
        requestId,
        timestamp: new Date().toISOString(),
        userId: req.user?.id || "anonymous",
        tenantId: req.user?.tenantId || "unknown",
        action: "API_REQUEST",
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Capture response
      const originalSend = res.send;
      res.send = function (body) {
        auditLogger.log({
          requestId,
          timestamp: new Date().toISOString(),
          action: "API_RESPONSE",
          statusCode: res.statusCode,
        });

        return originalSend.call(this, body);
      };

      next();
    };
    ```

## Phase 5: Frontend Authentication Components

- [x] 5.1 Create authentication context provider

  - [x] 5.1.1 Implement auth context

    ```jsx
    // client/src/auth/AuthContext.js
    import React, {
      createContext,
      useState,
      useEffect,
      useContext,
    } from "react";
    import {
      login as apiLogin,
      logout as apiLogout,
      refreshToken,
    } from "./authService";

    const AuthContext = createContext(null);

    export const AuthProvider = ({ children }) => {
      const [currentUser, setCurrentUser] = useState(null);
      const [loading, setLoading] = useState(true);

      // Initialize auth state from localStorage
      useEffect(() => {
        const initAuth = async () => {
          const token = localStorage.getItem("accessToken");
          const userJson = localStorage.getItem("user");

          if (token && userJson) {
            const user = JSON.parse(userJson);
            setCurrentUser(user);
          }

          setLoading(false);
        };

        initAuth();
      }, []);

      // Login function
      const login = async (username, password) => {
        const success = await apiLogin(username, password);

        if (success) {
          const userJson = localStorage.getItem("user");
          if (userJson) {
            setCurrentUser(JSON.parse(userJson));
          }
        }

        return success;
      };

      // Logout function
      const logout = async () => {
        await apiLogout();
        setCurrentUser(null);
      };

      return (
        <AuthContext.Provider
          value={{
            currentUser,
            login,
            logout,
            isAuthenticated: !!currentUser,
          }}
        >
          {!loading && children}
        </AuthContext.Provider>
      );
    };

    // Custom hook for using auth
    export const useAuth = () => useContext(AuthContext);
    ```

- [x] 5.2 Create protected route component

  - [x] 5.2.1 Implement route protection

    ```jsx
    // client/src/components/ProtectedRoute.js
    import React from "react";
    import { Navigate, useLocation } from "react-router-dom";
    import { useAuth } from "../auth/AuthContext";

    const ProtectedRoute = ({ children }) => {
      const { isAuthenticated, currentUser } = useAuth();
      const location = useLocation();

      if (!isAuthenticated) {
        // Redirect to login page if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
      }

      return children;
    };

    export default ProtectedRoute;
    ```

- [x] 5.3 Create login form component

  - [x] 5.3.1 Implement login form

    ```jsx
    // client/src/components/LoginForm.js
    import React, { useState } from "react";
    import { useNavigate, useLocation } from "react-router-dom";
    import { useAuth } from "../auth/AuthContext";

    const LoginForm = () => {
      const [username, setUsername] = useState("");
      const [password, setPassword] = useState("");
      const [error, setError] = useState("");
      const [loading, setLoading] = useState(false);

      const { login } = useAuth();
      const navigate = useNavigate();
      const location = useLocation();

      // Get the page the user was trying to access
      const from = location.state?.from?.pathname || "/";

      const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !password) {
          setError("Please enter both username and password");
          return;
        }

        setLoading(true);
        setError("");

        try {
          const success = await login(username, password);

          if (success) {
            // Navigate to the page the user was trying to access
            navigate(from, { replace: true });
          } else {
            setError("Invalid username or password");
          }
        } catch (error) {
          setError("An error occurred during login. Please try again.");
          console.error("Login error:", error);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="login-form">
          <h2>Login</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      );
    };

    export default LoginForm;
    ```

## Phase 6: API Route Protection and Integration

- [x] 6.1 Update server routes with authentication

  - [x] 6.1.1 Secure API routes

    ```javascript
    // server/server.js
    const express = require("express");
    const cors = require("cors");
    const cookieParser = require("cookie-parser");
    const { verifyToken } = require("./middleware/authMiddleware");
    const { verifyTenant } = require("./middleware/tenantMiddleware");
    const { auditMiddleware } = require("./middleware/auditMiddleware");
    const authController = require("./auth/authController");
    const mcpService = require("./services/mcpService");

    const app = express();

    // Middleware
    app.use(
      cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true, // Important for cookies
      })
    );
    app.use(express.json());
    app.use(cookieParser());

    // Auth routes (unprotected)
    app.post("/api/auth/login", authController.login);
    app.post("/api/auth/refresh", authController.refreshToken);
    app.post("/api/auth/logout", authController.logout);

    // Protected routes - apply authentication and audit
    app.use("/api/loans", verifyToken, auditMiddleware);

    // Set tenant context for MCP
    app.use("/api/loans", (req, res, next) => {
      mcpService.setTenantContext(req.user.tenantId);
      next();
    });

    // Apply tenant verification to specific endpoints
    app.get("/api/loans", verifyTenant, (req, res) => {
      // Get all loans with tenant filtering applied automatically
      const loans = require("./loans.json").filter(
        (loan) => loan.tenantId === req.user.tenantId
      );
      res.json(loans);
    });

    app.get("/api/loan/:id", verifyTenant, (req, res) => {
      // Tenant verification middleware already checked ownership
      const loans = require("./loans.json");
      const loan = loans.find((l) => l.id === req.params.id);

      if (loan) {
        res.json(loan);
      } else {
        res.status(404).json({ error: "Loan not found" });
      }
    });

    // Other routes...
    ```

- [x] 6.2 Add secure MCP operations to server

  - [x] 6.2.1 Implement secure API endpoints using MCP

    ```javascript
    // Secure MCP operation
    app.get(
      "/api/loans/sensitive/:id",
      verifyToken,
      verifyTenant,
      async (req, res) => {
        try {
          const loanId = req.params.id;
          const tenantId = req.user.tenantId;

          // Use encryption service for sensitive data
          const encryptionService = require("./services/encryptionService");

          // Get data from MCP
          const rawLoanData = await mcpService.getLoanData(loanId);

          // Encrypt for transit
          const encryptedData = encryptionService.encryptWithTenantKey(
            rawLoanData,
            tenantId
          );

          res.json({
            loanId,
            encryptedData,
            encryptionMethod: "aes-256-cbc",
          });
        } catch (error) {
          console.error("Error in secure MCP operation:", error);
          res.status(500).json({ error: "Internal server error" });
        }
      }
    );
    ```

## Phase 7: Testing and Deployment

- [x] 7.1 Create sample users file for testing

  - [x] 7.1.1 Add sample users with tenant information
    ```javascript
    // server/users.json
    [
      {
        id: "user1",
        username: "johndoe",
        passwordHash:
          "$2b$10$XQvDeJG9UAQhSX0Q.rjXCej7Ze/lMZ.UYD9IyXB86A/bXL1IYrEba", // "password123"
        tenantId: "tenant1",
        role: "loan_officer",
      },
      {
        id: "user2",
        username: "janesmith",
        passwordHash:
          "$2b$10$XQvDeJG9UAQhSX0Q.rjXCej7Ze/lMZ.UYD9IyXB86A/bXL1IYrEba", // "password123"
        tenantId: "tenant2",
        role: "loan_officer",
      },
    ];
    ```

- [x] 7.2 Update loans file with tenant information

  - [x] 7.2.1 Add tenant IDs to sample loans
    ```javascript
    // server/loans.json
    [
      {
        id: "12345",
        borrower: "John Doe",
        amount: 50000,
        status: "Active",
        interestRate: 3.5,
        paymentHistory: ["On time", "On time", "Late"],
        tenantId: "tenant1",
      },
      {
        id: "67890",
        borrower: "Jane Smith",
        amount: 30000,
        status: "Pending",
        interestRate: 4.0,
        paymentHistory: [],
        tenantId: "tenant1",
      },
      {
        id: "23456",
        borrower: "John Doe",
        amount: 20000,
        status: "Active",
        interestRate: 3.0,
        paymentHistory: ["On time"],
        tenantId: "tenant1",
      },
      {
        id: "34567",
        borrower: "Alice Johnson",
        amount: 40000,
        status: "Closed",
        interestRate: 3.8,
        paymentHistory: ["On time", "On time"],
        tenantId: "tenant2",
      },
    ];
    ```

- [x] 7.3 Test multi-tenant isolation
  - [x] 7.3.1 Log in with different tenant users
  - [x] 7.3.2 Verify data isolation between tenants

## Security Best Practices

- [x] Use HTTPS in production
- [x] Store sensitive data in environment variables
- [x] Keep dependencies up-to-date with regular security audits
- [x] Use content security policy (CSP) headers on the client
- [x] Implement rate limiting to prevent brute force attacks
- [x] Rotate JWT and refresh tokens on a regular schedule
- [x] Maintain audit logs for all authentication and data access events

## Conclusion

This authentication implementation provides a comprehensive security solution for multi-tenant banking applications using MCP. It ensures proper tenant isolation, secures data access, protects the MCP service, and provides a solid foundation for meeting regulatory compliance requirements.
