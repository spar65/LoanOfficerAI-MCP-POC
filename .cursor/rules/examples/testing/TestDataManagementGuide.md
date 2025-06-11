# Test Data Management Guide

This guide provides best practices for managing test data across different testing environments in enterprise applications.

## Key Principles

1. **Isolation**: Test data should be isolated between environments and test runs
2. **Representativeness**: Test data should represent realistic scenarios
3. **Reproducibility**: Test scenarios should be reproducible using controlled data
4. **Security**: Sensitive data must be anonymized or synthesized
5. **Automation**: Test data creation and management should be automated

## Test Data Strategies

### 1. Synthetic Data Generation

Create artificially-generated data that mimics production patterns but contains no real user information.

```typescript
// data-generator.ts
import { faker } from "@faker-js/faker";
import { prisma } from "./prisma-client";

export async function generateTestUsers(count: number = 50) {
  const users = [];

  for (let i = 0; i < count; i++) {
    users.push({
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      dateOfBirth: faker.date.past({ years: 50 }),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      createdAt: faker.date.recent({ days: 90 }),
      lastLoginAt: faker.date.recent({ days: 10 }),
    });
  }

  // Batch insert users
  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  return users;
}

export async function generateTestOrders(
  userIds: string[],
  count: number = 100
) {
  const orders = [];
  const productIds = await getProductIds();

  for (let i = 0; i < count; i++) {
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const orderDate = faker.date.recent({ days: 30 });

    const orderItems = [];
    const itemCount = Math.floor(Math.random() * 5) + 1;

    for (let j = 0; j < itemCount; j++) {
      const productId =
        productIds[Math.floor(Math.random() * productIds.length)];
      orderItems.push({
        productId,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: parseFloat(faker.commerce.price()),
      });
    }

    orders.push({
      userId,
      orderDate,
      status: faker.helpers.arrayElement([
        "pending",
        "processing",
        "shipped",
        "delivered",
      ]),
      shippingAddress: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      items: orderItems,
      totalAmount: orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    });
  }

  // Batch insert orders
  for (const order of orders) {
    const { items, ...orderData } = order;
    const createdOrder = await prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: items,
        },
      },
    });
  }

  return orders;
}
```

### 2. Data Anonymization

For when you need to use production-like data but must protect PII:

```typescript
// anonymizer.ts
import { createHash } from "crypto";
import { prisma } from "./prisma-client";

export async function anonymizeProductionData() {
  // Anonymize user data
  await prisma.user.updateMany({
    data: {
      email: {
        set: raw(`CONCAT(MD5(email), '@example.com')`),
      },
      firstName: {
        set: raw(`CONCAT('User_', id)`),
      },
      lastName: {
        set: raw(`'Anonymized'`),
      },
      phone: {
        set: raw(`CONCAT('+1555', FLOOR(RAND() * 1000000) + 1000000)`),
      },
      ssn: {
        set: null,
      },
      dateOfBirth: {
        set: raw(`DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 20000) DAY)`),
      },
    },
  });

  // Anonymize payment information
  await prisma.paymentMethod.updateMany({
    data: {
      cardNumber: {
        set: raw(`CONCAT('XXXX-XXXX-XXXX-', RIGHT(cardNumber, 4))`),
      },
      cardCvv: {
        set: "***",
      },
      cardholderName: {
        set: "ANONYMIZED",
      },
    },
  });

  console.log("Data anonymization complete");
}

// Helper function to hash personally identifiable information
export function hashPii(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// Helper function to generate consistent pseudonyms
const pseudonymCache = new Map<string, string>();
export function getPseudonym(
  originalValue: string,
  prefix: string = ""
): string {
  if (pseudonymCache.has(originalValue)) {
    return pseudonymCache.get(originalValue)!;
  }

  const hash = hashPii(originalValue);
  const pseudonym = `${prefix}${hash.substring(0, 8)}`;
  pseudonymCache.set(originalValue, pseudonym);

  return pseudonym;
}
```

### 3. Snapshot-Based Testing

Use snapshots of databases to provide consistent test data:

```typescript
// db-snapshot.ts
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

export async function createDatabaseSnapshot(snapshotName: string) {
  const environment = process.env.NODE_ENV || "development";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${environment}_${snapshotName}_${timestamp}.sql`;
  const snapshotPath = path.join(
    process.cwd(),
    "test-data",
    "snapshots",
    filename
  );

  // Ensure directory exists
  await fs.promises.mkdir(path.dirname(snapshotPath), { recursive: true });

  // Get database credentials from environment
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  // Create the snapshot using pg_dump (PostgreSQL example)
  const command = `PGPASSWORD=${DB_PASSWORD} pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f ${snapshotPath}`;

  try {
    await execAsync(command);
    console.log(`Database snapshot created at ${snapshotPath}`);
    return snapshotPath;
  } catch (error) {
    console.error("Failed to create database snapshot:", error);
    throw error;
  }
}

export async function restoreDatabaseSnapshot(snapshotPath: string) {
  // Get database credentials from environment
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  // Drop existing database
  const dropCommand = `PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -c "DROP DATABASE IF EXISTS ${DB_NAME};"`;

  // Create empty database
  const createCommand = `PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -c "CREATE DATABASE ${DB_NAME};"`;

  // Restore from snapshot
  const restoreCommand = `PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f ${snapshotPath}`;

  try {
    await execAsync(dropCommand);
    await execAsync(createCommand);
    await execAsync(restoreCommand);
    console.log(`Database restored from snapshot: ${snapshotPath}`);
  } catch (error) {
    console.error("Failed to restore database snapshot:", error);
    throw error;
  }
}
```

### 4. Test Fixtures

Create reusable test fixtures for specific test scenarios:

```typescript
// fixtures.ts
import { prisma } from "./prisma-client";

export interface Fixture<T> {
  create(): Promise<T>;
  createMany(count: number): Promise<T[]>;
  cleanup(): Promise<void>;
}

export class UserFixture implements Fixture<any> {
  private createdIds: string[] = [];

  async create(overrides: any = {}) {
    const user = await prisma.user.create({
      data: {
        email: overrides.email || `test-${Date.now()}@example.com`,
        firstName: overrides.firstName || "Test",
        lastName: overrides.lastName || "User",
        isActive: overrides.isActive !== undefined ? overrides.isActive : true,
        role: overrides.role || "USER",
        ...overrides,
      },
    });

    this.createdIds.push(user.id);
    return user;
  }

  async createMany(count: number, overrides: any = {}) {
    const users = [];

    for (let i = 0; i < count; i++) {
      users.push(
        await this.create({
          email: `test-${Date.now()}-${i}@example.com`,
          ...overrides,
        })
      );
    }

    return users;
  }

  async cleanup() {
    if (this.createdIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: this.createdIds,
          },
        },
      });
      this.createdIds = [];
    }
  }
}

// Example usage in tests
export async function setupTestData() {
  const userFixture = new UserFixture();

  // Create admin user
  const admin = await userFixture.create({
    role: "ADMIN",
    email: "admin@example.com",
  });

  // Create regular users
  const users = await userFixture.createMany(5);

  return { admin, users, fixtures: { userFixture } };
}

// Cleanup after tests
export async function cleanupTestData(fixtures: any) {
  await Promise.all(
    Object.values(fixtures).map((fixture: any) => fixture.cleanup())
  );
}
```

## Environment-Specific Data Management

### Development Environment

Development environments should use lightweight, rapidly refreshable data:

```typescript
// dev-data-setup.ts
import { prisma } from "./prisma-client";
import { generateTestUsers, generateTestOrders } from "./data-generator";

export async function setupDevEnvironment() {
  console.log("Setting up development environment data...");

  // Clear existing data
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.product.deleteMany({});

  // Generate base product catalog
  const products = await generateProductCatalog(50);

  // Generate test users
  const users = await generateTestUsers(20);
  const userIds = users.map((user) => user.id);

  // Generate test orders
  const orders = await generateTestOrders(userIds, 50);

  console.log("Development environment setup complete.");
  console.log(
    `Created ${users.length} users, ${products.length} products, and ${orders.length} orders.`
  );
}
```

### Integration Environment

Integration environments need more comprehensive data that's refreshed less frequently:

```typescript
// int-data-setup.ts
import { prisma } from "./prisma-client";
import * as generators from "./data-generator";
import { restoreDatabaseSnapshot, createDatabaseSnapshot } from "./db-snapshot";

export async function setupIntEnvironment() {
  console.log("Setting up integration environment data...");

  try {
    // Try to restore from the latest snapshot first
    const latestSnapshot = await findLatestSnapshot("int");
    if (latestSnapshot) {
      await restoreDatabaseSnapshot(latestSnapshot);
      console.log("Integration environment restored from snapshot.");
      return;
    }
  } catch (error) {
    console.warn(
      "Could not restore from snapshot, generating fresh data instead"
    );
  }

  // Clear existing data
  await prisma.$transaction([
    prisma.$executeRaw`TRUNCATE "OrderItem" CASCADE`,
    prisma.$executeRaw`TRUNCATE "Order" CASCADE`,
    prisma.$executeRaw`TRUNCATE "User" CASCADE`,
    prisma.$executeRaw`TRUNCATE "Product" CASCADE`,
    prisma.$executeRaw`TRUNCATE "Category" CASCADE`,
  ]);

  // Generate comprehensive test data
  const categories = await generators.generateCategories(10);
  const products = await generators.generateProducts(200, categories);
  const users = await generators.generateTestUsers(100);
  const userIds = users.map((user) => user.id);
  const orders = await generators.generateTestOrders(userIds, 500);

  // Create additional specialized data for specific test scenarios
  await generators.generateInactiveUsers(10);
  await generators.generateFailedOrders(userIds, 20);

  // Create a snapshot for future use
  await createDatabaseSnapshot("full_setup");

  console.log("Integration environment setup complete.");
}
```

### Staging Environment

Staging environments should use anonymized production-like data:

```typescript
// stg-data-setup.ts
import { anonymizeProductionData } from "./anonymizer";
import { restoreDatabaseSnapshot, createDatabaseSnapshot } from "./db-snapshot";

export async function setupStagingEnvironment() {
  console.log("Setting up staging environment data...");

  // Restore from production snapshot (this would be done through your database admin)
  // Instead we'll simulate that process here
  const prodSnapshotPath = "./production-data-backup.sql";

  // Restore the snapshot
  await restoreDatabaseSnapshot(prodSnapshotPath);

  // Anonymize sensitive data
  await anonymizeProductionData();

  // Create a staging snapshot for future use
  await createDatabaseSnapshot("staging_anonymized");

  console.log("Staging environment setup complete.");
}
```

## Test Data Reset Strategies

### Full Reset

Complete database reset between test runs:

```typescript
// full-reset.ts
import { prisma } from "./prisma-client";

export async function performFullReset() {
  // Disable foreign key checks temporarily
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;

  // Get all table names (example for MySQL)
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE();
  `;

  // Truncate all tables
  for (const { table_name } of tables) {
    if (table_name !== "_prisma_migrations") {
      await prisma.$executeRaw(`TRUNCATE TABLE \`${table_name}\`;`);
    }
  }

  // Re-enable foreign key checks
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;

  console.log("Database reset complete");
}
```

### Transaction-Based Reset

Use transactions to automatically roll back changes:

```typescript
// transaction-reset.ts
import { prisma } from "./prisma-client";

export async function withTestTransaction<T>(
  testFn: () => Promise<T>
): Promise<T> {
  // Start transaction
  const [result] = await prisma
    .$transaction(
      async (tx) => {
        // Run the test with the transaction client
        const result = await testFn();

        // This will cause the transaction to be rolled back
        throw new Error("__ROLLBACK__");

        return [result];
      },
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: "Serializable",
      }
    )
    .catch((err) => {
      if (err.message === "__ROLLBACK__") {
        return [null]; // We expected this error to roll back the transaction
      }
      throw err; // An actual error occurred
    });

  return result;
}

// Example usage
describe("Order creation", () => {
  it("should create an order", async () => {
    await withTestTransaction(async () => {
      // Any database changes made here will be rolled back
      const newOrder = await orderService.createOrder({
        userId: "test-user-id",
        items: [{ productId: "test-product-id", quantity: 1 }],
      });

      expect(newOrder).toBeDefined();
      expect(newOrder.items.length).toBe(1);
    });
  });
});
```

### Isolated Test Database

Use a separate test database for each test run:

```typescript
// database-manager.ts
import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";

const execAsync = promisify(exec);

export class TestDatabaseManager {
  private dbName: string;
  private prismaClient: PrismaClient | null = null;

  constructor(prefix: string = "test_db") {
    // Create a unique database name
    this.dbName = `${prefix}_${uuidv4().replace(/-/g, "")}`;
  }

  async setup() {
    const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD } = process.env;

    // Create a new test database
    await execAsync(
      `PGPASSWORD=${DB_PASSWORD} createdb -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} ${this.dbName}`
    );

    // Run migrations on the test database
    process.env.DATABASE_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${this.dbName}`;
    await execAsync("npx prisma migrate deploy");

    // Create a new Prisma client connected to the test database
    this.prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    return this.prismaClient;
  }

  async teardown() {
    if (this.prismaClient) {
      await this.prismaClient.$disconnect();
      this.prismaClient = null;
    }

    const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD } = process.env;

    // Drop the test database
    await execAsync(
      `PGPASSWORD=${DB_PASSWORD} dropdb -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} --if-exists ${this.dbName}`
    );
  }

  getClient() {
    if (!this.prismaClient) {
      throw new Error("Test database not set up. Call setup() first.");
    }
    return this.prismaClient;
  }
}

// Example usage in Jest
beforeAll(async () => {
  global.testDbManager = new TestDatabaseManager();
  global.prisma = await global.testDbManager.setup();

  // Seed with test data
  await seedTestData(global.prisma);
});

afterAll(async () => {
  await global.testDbManager.teardown();
});
```

## Data Security and Compliance

### PII Handling

Guidelines for handling personally identifiable information:

```typescript
// pii-handling.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Encryption key should be stored securely and accessed via environment variables
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export function encryptPii(text: string): { encrypted: string; iv: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    encrypted,
    iv: iv.toString("hex"),
  };
}

export function decryptPii(encrypted: string, iv: string): string {
  const decipher = createDecipheriv(
    "aes-256-cbc",
    ENCRYPTION_KEY,
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Store PII data with encryption
export async function storePiiData(
  userId: string,
  piiData: Record<string, string>
) {
  const encryptedFields: Record<string, any> = {};

  for (const [key, value] of Object.entries(piiData)) {
    const { encrypted, iv } = encryptPii(value);
    encryptedFields[key] = encrypted;
    encryptedFields[`${key}Iv`] = iv;
  }

  await prisma.userPii.upsert({
    where: { userId },
    update: encryptedFields,
    create: {
      userId,
      ...encryptedFields,
    },
  });
}

// Retrieve and decrypt PII data
export async function retrievePiiData(
  userId: string
): Promise<Record<string, string>> {
  const piiRecord = await prisma.userPii.findUnique({
    where: { userId },
  });

  if (!piiRecord) {
    return {};
  }

  const decryptedData: Record<string, string> = {};

  for (const [key, value] of Object.entries(piiRecord)) {
    if (
      key.endsWith("Iv") ||
      key === "id" ||
      key === "userId" ||
      key === "createdAt" ||
      key === "updatedAt"
    ) {
      continue;
    }

    const ivKey = `${key}Iv`;
    if (piiRecord[ivKey]) {
      decryptedData[key] = decryptPii(
        value as string,
        piiRecord[ivKey] as string
      );
    }
  }

  return decryptedData;
}
```

### Data Masking

Apply appropriate data masking for different environments:

```typescript
// data-masking.ts
export enum MaskingLevel {
  NONE = "none", // No masking (production)
  PARTIAL = "partial", // Partial masking (staging)
  FULL = "full", // Complete masking (dev/int)
}

export function getMaskingLevel(): MaskingLevel {
  const env = process.env.NODE_ENV || "development";

  switch (env) {
    case "production":
      return MaskingLevel.NONE;
    case "staging":
      return MaskingLevel.PARTIAL;
    default:
      return MaskingLevel.FULL;
  }
}

export function maskPii(
  value: string,
  type: string,
  level: MaskingLevel = getMaskingLevel()
): string {
  if (level === MaskingLevel.NONE) {
    return value;
  }

  switch (type) {
    case "email":
      if (level === MaskingLevel.PARTIAL) {
        // mask username portion of email: john.doe@example.com -> j***e@example.com
        const [username, domain] = value.split("@");
        return `${username[0]}***${username[username.length - 1]}@${domain}`;
      } else {
        // full masking: use fake email
        return `user_${Math.random().toString(36).substring(2, 8)}@example.com`;
      }

    case "phone":
      if (level === MaskingLevel.PARTIAL) {
        // Mask middle digits: (123) 456-7890 -> (123) ***-7890
        return value.replace(/(\(\d{3}\)\s)(\d{3})(-\d{4})/, "$1***$3");
      } else {
        // Generate fake phone number
        return `(555) ${Math.floor(Math.random() * 900) + 100}-${
          Math.floor(Math.random() * 9000) + 1000
        }`;
      }

    case "creditCard":
      // Always mask credit card except last 4 digits
      return value.replace(/\d(?=\d{4})/g, "*");

    case "ssn":
      // Always fully mask SSN
      return "***-**-****";

    case "address":
      if (level === MaskingLevel.PARTIAL) {
        // Keep city and state but mask street address
        const addressParts = value.split(",");
        return `${
          Math.floor(Math.random() * 9000) + 1000
        } Main St,${addressParts.slice(1).join(",")}`;
      } else {
        // Generate fake address
        return `${
          Math.floor(Math.random() * 9000) + 1000
        } Test Street, Testville, TS 12345`;
      }

    default:
      return value;
  }
}
```

## Test Data Documentation

Document what test data exists and how to use it:

```typescript
// test-data-catalog.ts
export const TEST_DATA_CATALOG = {
  users: {
    description: "Test user accounts for various scenarios",
    data: [
      {
        id: "admin-user",
        email: "admin@example.com",
        password: "Test123!",
        role: "ADMIN",
        description: "Administrator with full system access",
      },
      {
        id: "standard-user",
        email: "user@example.com",
        password: "Test123!",
        role: "USER",
        description: "Standard user with basic permissions",
      },
      {
        id: "locked-user",
        email: "locked@example.com",
        password: "Test123!",
        role: "USER",
        status: "LOCKED",
        description: "User with a locked account for testing lockout flows",
      },
    ],
  },
  products: {
    description: "Test products with various attributes",
    data: [
      {
        id: "basic-product",
        name: "Basic Widget",
        price: 19.99,
        inStock: true,
        description: "Standard product that is in stock",
      },
      {
        id: "out-of-stock-product",
        name: "Deluxe Widget",
        price: 59.99,
        inStock: false,
        description: "Out of stock product for testing inventory handling",
      },
      {
        id: "discounted-product",
        name: "Sale Widget",
        price: 29.99,
        discount: 0.25,
        inStock: true,
        description: "Product with an active discount",
      },
    ],
  },
  orders: {
    description: "Test orders in various states",
    data: [
      {
        id: "pending-order",
        user: "standard-user",
        status: "PENDING",
        totalAmount: 89.97,
        items: 3,
        description: "Order that is pending processing",
      },
      {
        id: "shipped-order",
        user: "standard-user",
        status: "SHIPPED",
        totalAmount: 59.99,
        items: 1,
        description: "Order that has been shipped",
      },
      {
        id: "cancelled-order",
        user: "standard-user",
        status: "CANCELLED",
        totalAmount: 159.95,
        items: 2,
        description: "Order that has been cancelled",
      },
    ],
  },
};

// Function to retrieve canonical test data by ID
export function getTestData(category: string, id: string) {
  const catalog = TEST_DATA_CATALOG[category as keyof typeof TEST_DATA_CATALOG];
  if (!catalog) {
    throw new Error(`Unknown test data category: ${category}`);
  }

  const item = catalog.data.find((item) => item.id === id);
  if (!item) {
    throw new Error(`Unknown test data ID: ${id} in category ${category}`);
  }

  return item;
}

// Function to set up specific test scenarios
export async function setupTestScenario(scenarioName: string) {
  switch (scenarioName) {
    case "empty-cart":
      // Setup an empty cart for the standard user
      break;

    case "checkout-flow":
      // Setup a cart with items ready for checkout
      break;

    case "payment-failure":
      // Setup an order that will trigger a payment failure
      break;

    default:
      throw new Error(`Unknown test scenario: ${scenarioName}`);
  }
}
```
