# API Versioning & Immutability Guide

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide provides concrete examples for implementing API versioning, immutability, and enterprise-level API management following the guidelines in [060-api-standards.mdc](mdc:060-api-standards.mdc).

## Table of Contents

1. [API Versioning Strategies](#api-versioning-strategies)
2. [Immutable API Contracts](#immutable-api-contracts)
3. [Versioned Interface Patterns](#versioned-interface-patterns)
4. [API Lifecycle Management](#api-lifecycle-management)
5. [Breaking vs. Non-Breaking Changes](#breaking-vs-non-breaking-changes)
6. [Enterprise API Governance](#enterprise-api-governance)
7. [Backward Compatibility](#backward-compatibility)
8. [Documentation & Change Management](#documentation-and-change-management)

## API Versioning Strategies

There are several patterns for API versioning, each with advantages and disadvantages.

### URL Path Versioning

This approach includes the version in the URL path.

```typescript
// Example: URL Path versioning
// Route handler for /api/v1/organizations/:orgId/users
export async function getUsersV1(req: Request, res: Response) {
  // Implementation for V1 API
}

// Route handler for /api/v2/organizations/:orgId/users
export async function getUsersV2(req: Request, res: Response) {
  // Enhanced implementation for V2 API
}

// Route configuration
const routes = [
  {
    path: "/api/v1/organizations/:orgId/users",
    method: "GET",
    handler: getUsersV1,
  },
  {
    path: "/api/v2/organizations/:orgId/users",
    method: "GET",
    handler: getUsersV2,
  },
];
```

### HTTP Header Versioning

This approach uses a custom HTTP header to specify the API version.

```typescript
// Example: HTTP Header versioning
// Middleware to determine API version
function apiVersionMiddleware(req: Request, res: Response, next: NextFunction) {
  // Get version from 'API-Version' header, default to '1.0'
  const apiVersion = req.header("API-Version") || "1.0";
  req.apiVersion = apiVersion;
  next();
}

// Router with version selection
export async function getUsers(req: Request, res: Response) {
  switch (req.apiVersion) {
    case "2.0":
      return getUsersV2Implementation(req, res);
    case "1.0":
    default:
      return getUsersV1Implementation(req, res);
  }
}

// Route configuration
app.use(apiVersionMiddleware);
app.get("/api/organizations/:orgId/users", getUsers);
```

### Accept Header Versioning

This approach uses the HTTP Accept header with a custom media type.

```typescript
// Example: Accept Header versioning
// Middleware to parse API version from Accept header
function acceptHeaderVersioning(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const acceptHeader = req.header("Accept");
  // Match version in: 'application/vnd.company.v2+json'
  const versionMatch = acceptHeader?.match(
    /application\/vnd\.company\.v(\d+)\+json/
  );
  req.apiVersion = versionMatch ? versionMatch[1] : "1";
  next();
}

// Router with version selection
export async function getUsers(req: Request, res: Response) {
  switch (req.apiVersion) {
    case "2":
      return getUsersV2Implementation(req, res);
    case "1":
    default:
      return getUsersV1Implementation(req, res);
  }
}

// Route configuration
app.use(acceptHeaderVersioning);
app.get("/api/organizations/:orgId/users", getUsers);
```

### Query Parameter Versioning

This approach passes the version as a query parameter.

```typescript
// Example: Query Parameter versioning
export async function getUsers(req: Request, res: Response) {
  const version = req.query.version || "1";

  switch (version) {
    case "2":
      return getUsersV2Implementation(req, res);
    case "1":
    default:
      return getUsersV1Implementation(req, res);
  }
}

// Route configuration
app.get("/api/organizations/:orgId/users", getUsers);
```

### Recommendation

For enterprise systems, URL path versioning is typically recommended for its simplicity, visibility, and compatibility with caching and routing systems.

## Immutable API Contracts

Immutable API contracts ensure that once published, an API version's behavior doesn't change in backward-incompatible ways.

### Interface Definition

Define clear interfaces for each API version that should not change after deployment:

```typescript
// Example: Immutable API interfaces in TypeScript
// V1 User interface - once published, this cannot change
export interface UserV1 {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

// V2 User interface - adds new fields but keeps backward compatibility
export interface UserV2 extends Omit<UserV1, "created_at"> {
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string; // renamed from created_at
  updatedAt: string; // new field
  role: string; // new field
}

// Response format interfaces
export interface PaginatedResponseV1<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface PaginatedResponseV2<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number; // renamed from 'limit'
    totalItems: number; // renamed from 'total'
    totalPages: number; // new field
  };
  links: {
    // new section
    self: string;
    next?: string;
    prev?: string;
  };
}
```

### Repository Pattern for Version Separation

Use a repository pattern to separate implementation details from API contracts:

```typescript
// Example: Repository pattern for version separation
// Base repository interface
interface UserRepository {
  findAll(orgId: string, options?: QueryOptions): Promise<User[]>;
  findById(orgId: string, id: string): Promise<User>;
  create(orgId: string, data: CreateUserData): Promise<User>;
  update(orgId: string, id: string, data: UpdateUserData): Promise<User>;
  delete(orgId: string, id: string): Promise<void>;
}

// V1 Repository
class UserRepositoryV1 implements UserRepository {
  // Implementations for V1 API
}

// V2 Repository
class UserRepositoryV2 implements UserRepository {
  // Enhanced implementations for V2 API
}

// Controller using the repository pattern
class UserController {
  constructor(private repository: UserRepository) {}

  async getUsers(req: Request, res: Response) {
    const { orgId } = req.params;
    const users = await this.repository.findAll(orgId);
    return res.json({ data: users });
  }
}

// Factory to create the appropriate repository based on API version
function createUserRepository(apiVersion: string): UserRepository {
  switch (apiVersion) {
    case "v2":
      return new UserRepositoryV2();
    case "v1":
    default:
      return new UserRepositoryV1();
  }
}
```

## Versioned Interface Patterns

### Type Aliases for Version Control

Use TypeScript type aliases to control mapping between versions:

```typescript
// Example: Type aliases for version control
// Database model (internal representation)
interface UserModel {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: Date;
  updated_at: Date;
  organization_id: string;
}

// V1 API response (external representation)
interface UserResponseV1 {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

// V2 API response (external representation)
interface UserResponseV2 {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Mapper functions
function mapUserToV1Response(user: UserModel): UserResponseV1 {
  return {
    id: user._id,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    created_at: user.created_at.toISOString(),
  };
}

function mapUserToV2Response(user: UserModel): UserResponseV2 {
  return {
    id: user._id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at.toISOString(),
  };
}
```

### Adapter Pattern for API Versions

Implement the adapter pattern to transform between internal and versioned external representations:

```typescript
// Example: Adapter pattern for API versions
// Adapter interface
interface UserAdapter {
  adaptToResponse(user: UserModel): any;
  adaptFromRequest(requestData: any): Partial<UserModel>;
}

// V1 adapter implementation
class UserAdapterV1 implements UserAdapter {
  adaptToResponse(user: UserModel): UserResponseV1 {
    return mapUserToV1Response(user);
  }

  adaptFromRequest(requestData: any): Partial<UserModel> {
    const { name, email } = requestData;
    const [first_name, last_name] = (name || "").split(" ", 2);

    return {
      first_name: first_name || "",
      last_name: last_name || "",
      email,
    };
  }
}

// V2 adapter implementation
class UserAdapterV2 implements UserAdapter {
  adaptToResponse(user: UserModel): UserResponseV2 {
    return mapUserToV2Response(user);
  }

  adaptFromRequest(requestData: any): Partial<UserModel> {
    const { firstName, lastName, email, role } = requestData;

    return {
      first_name: firstName,
      last_name: lastName,
      email,
      role,
    };
  }
}

// Service using adapters
class UserService {
  constructor(private adapter: UserAdapter) {}

  async getUsers(orgId: string): Promise<any[]> {
    const users = await UserModel.find({ organization_id: orgId });
    return users.map((user) => this.adapter.adaptToResponse(user));
  }

  async createUser(orgId: string, data: any): Promise<any> {
    const userData = this.adapter.adaptFromRequest(data);
    const user = await UserModel.create({
      ...userData,
      organization_id: orgId,
    });
    return this.adapter.adaptToResponse(user);
  }
}
```

## API Lifecycle Management

### API Versioning Strategy

Define a clear lifecycle for API versions:

```typescript
// Example: API lifecycle constants
enum ApiStatus {
  PREVIEW = "preview",
  STABLE = "stable",
  DEPRECATED = "deprecated",
  RETIRED = "retired",
}

interface ApiVersionInfo {
  version: string;
  status: ApiStatus;
  releaseDate: Date;
  deprecationDate?: Date;
  retirementDate?: Date;
  successor?: string;
}

// API version registry
const API_VERSIONS: Record<string, ApiVersionInfo> = {
  v1: {
    version: "v1",
    status: ApiStatus.DEPRECATED,
    releaseDate: new Date("2022-01-01"),
    deprecationDate: new Date("2023-01-01"),
    retirementDate: new Date("2024-01-01"),
    successor: "v2",
  },
  v2: {
    version: "v2",
    status: ApiStatus.STABLE,
    releaseDate: new Date("2023-01-01"),
  },
  v3: {
    version: "v3",
    status: ApiStatus.PREVIEW,
    releaseDate: new Date("2023-10-01"),
  },
};
```

### API Deprecation Response Headers

Add response headers to inform clients about API deprecation:

```typescript
// Example: Middleware for API deprecation notices
function apiDeprecationHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const version = req.params.version || "v1";
  const versionInfo = API_VERSIONS[version];

  if (versionInfo) {
    // Add API version info to response headers
    res.setHeader("X-API-Version", versionInfo.version);
    res.setHeader("X-API-Status", versionInfo.status);

    if (versionInfo.status === ApiStatus.DEPRECATED) {
      // Add deprecation headers according to RFC 8594
      res.setHeader("Deprecation", "true");

      if (versionInfo.retirementDate) {
        res.setHeader("Sunset", versionInfo.retirementDate.toISOString());
      }

      if (versionInfo.successor) {
        const host = req.get("host");
        const protocol = req.protocol;
        const path = req.path.replace(
          `/${version}/`,
          `/${versionInfo.successor}/`
        );
        res.setHeader(
          "Link",
          `<${protocol}://${host}${path}>; rel="successor-version"`
        );
      }
    }
  }

  next();
}
```

## Breaking vs. Non-Breaking Changes

### Guidelines for Identifying Changes

```typescript
// Example documentation of breaking vs. non-breaking changes

/*
 * BREAKING CHANGES (REQUIRE A NEW API VERSION):
 * 1. Removing or renaming fields in a response
 * 2. Changing field data types or formats
 * 3. Removing endpoints
 * 4. Changing response status codes
 * 5. Adding required request parameters
 * 6. Changing authentication mechanisms
 * 7. Changing error response formats
 *
 * NON-BREAKING CHANGES (CAN BE ADDED TO EXISTING VERSION):
 * 1. Adding new optional fields to responses
 * 2. Adding new endpoints
 * 3. Adding new optional query parameters
 * 4. Extending enumerations with new values
 * 5. Increasing rate limits
 * 6. Improving documentation
 * 7. Bug fixes that maintain expected behavior
 */

// Example: Adding a new field to UserResponseV1 without breaking the contract
interface UserResponseV1 {
  id: string;
  name: string;
  email: string;
  created_at: string;
  profile_image_url?: string; // New optional field (non-breaking)
}
```

## Enterprise API Governance

### API Registry & Discovery

Implement an API registry for discovery and governance:

```typescript
// Example: API registry implementation
interface ApiEndpointInfo {
  path: string;
  method: string;
  version: string;
  status: ApiStatus;
  description: string;
  owner: string;
  authRequired: boolean;
  rateLimit?: {
    requests: number;
    period: string; // e.g., "1m", "1h", "1d"
  };
}

class ApiRegistry {
  private endpoints: ApiEndpointInfo[] = [];

  registerEndpoint(info: ApiEndpointInfo): void {
    this.endpoints.push(info);
  }

  getEndpoints(filter?: Partial<ApiEndpointInfo>): ApiEndpointInfo[] {
    if (!filter) {
      return this.endpoints;
    }

    return this.endpoints.filter((endpoint) => {
      return Object.entries(filter).every(([key, value]) => {
        return endpoint[key] === value;
      });
    });
  }

  getEndpointsByVersion(version: string): ApiEndpointInfo[] {
    return this.getEndpoints({ version });
  }

  getDeprecatedEndpoints(): ApiEndpointInfo[] {
    return this.getEndpoints({ status: ApiStatus.DEPRECATED });
  }
}

// Example usage
const apiRegistry = new ApiRegistry();

apiRegistry.registerEndpoint({
  path: "/api/v1/organizations/:orgId/users",
  method: "GET",
  version: "v1",
  status: ApiStatus.DEPRECATED,
  description: "List users in an organization",
  owner: "Identity Team",
  authRequired: true,
  rateLimit: {
    requests: 100,
    period: "1m",
  },
});

apiRegistry.registerEndpoint({
  path: "/api/v2/organizations/:orgId/users",
  method: "GET",
  version: "v2",
  status: ApiStatus.STABLE,
  description:
    "List users in an organization with pagination and role filtering",
  owner: "Identity Team",
  authRequired: true,
  rateLimit: {
    requests: 100,
    period: "1m",
  },
});
```

### API Metrics & Monitoring

Implement monitoring to track API version usage:

```typescript
// Example: API usage metrics middleware
function apiMetricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const version = req.params.version || "v1";
  const method = req.method;
  const path = req.route.path;

  // Continue with request
  next();

  // After response is sent, record metrics
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Record metrics
    metrics.increment("api.requests.total", {
      version,
      method,
      path,
      status_code: statusCode,
    });

    metrics.histogram("api.requests.duration", duration, {
      version,
      method,
      path,
    });

    // Log API usage
    logger.info("API Request", {
      version,
      method,
      path,
      status_code: statusCode,
      duration,
    });
  });
}
```

## Backward Compatibility

### Compatibility Layer Example

```typescript
// Example: Backward compatibility layer
// Function to convert v2 response format to v1 format for backward compatibility
function convertV2ResponseToV1Format(
  v2Response: PaginatedResponseV2<UserResponseV2>
): PaginatedResponseV1<UserResponseV1> {
  return {
    data: v2Response.data.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      created_at: user.createdAt,
    })),
    pagination: {
      page: v2Response.pagination.page,
      limit: v2Response.pagination.pageSize,
      total: v2Response.pagination.totalItems,
    },
  };
}

// Route handler that uses the latest implementation but adapts response format
export async function getUsersV1(req: Request, res: Response) {
  // Use v2 implementation
  const v2Response = await getUsersV2Implementation(req);

  // Convert response to v1 format
  const v1Response = convertV2ResponseToV1Format(v2Response);

  return res.json(v1Response);
}
```

## Documentation and Change Management

### API Documentation with Version Information

```typescript
// Example: OpenAPI/Swagger documentation with versioning
const userApiDocsV1 = {
  openapi: "3.0.0",
  info: {
    title: "User API",
    version: "1.0.0",
    description: "API for managing users",
    "x-api-status": "deprecated",
    "x-sunset-date": "2024-01-01",
  },
  paths: {
    "/api/v1/organizations/{orgId}/users": {
      get: {
        summary: "List users in an organization",
        description:
          "Returns a paginated list of users in the specified organization",
        parameters: [
          {
            name: "orgId",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: {
              type: "integer",
              default: 1,
            },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: {
              type: "integer",
              default: 10,
            },
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/UserV1",
                      },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: {
                          type: "integer",
                        },
                        limit: {
                          type: "integer",
                        },
                        total: {
                          type: "integer",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      UserV1: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
          email: {
            type: "string",
          },
          created_at: {
            type: "string",
            format: "date-time",
          },
        },
      },
    },
  },
};

// V2 API documentation would follow a similar pattern with updated schema definitions
```

### Change Log Management

```typescript
// Example: API change log
const API_CHANGELOG = {
  v1: [
    {
      date: "2022-01-01",
      type: "release",
      description: "Initial release of the User API",
    },
    {
      date: "2022-03-15",
      type: "enhancement",
      description: "Added profile_image_url field to user responses",
    },
    {
      date: "2023-01-01",
      type: "deprecation",
      description: "Deprecated in favor of v2",
      details: "This version will be retired on 2024-01-01",
    },
  ],
  v2: [
    {
      date: "2023-01-01",
      type: "release",
      description:
        "Released v2 of the User API with improved field naming and pagination",
    },
    {
      date: "2023-02-15",
      type: "enhancement",
      description: "Added role filtering capability",
    },
    {
      date: "2023-05-10",
      type: "bugfix",
      description: "Fixed issue with pagination when using role filters",
    },
  ],
  v3: [
    {
      date: "2023-10-01",
      type: "preview",
      description: "Preview release of v3 with GraphQL support",
    },
  ],
};
```

## Related Documents

- [API Security Guidelines](mdc:departments/engineering/security/012-api-security.mdc)
- [Multi-Tenancy Requirements](mdc:departments/engineering/architecture/025-multi-tenancy.mdc)
- [TypeScript Interface Standards](mdc:departments/engineering/coding-standards/105-typescript-linter-standards.mdc)
