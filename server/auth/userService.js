/**
 * User service for managing authentication and user data
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const usersPath = path.join(__dirname, '../data/users.json');

/**
 * Load all users from the JSON file
 * @returns {Array} Array of user objects
 */
const loadUsers = () => {
  try {
    if (!fs.existsSync(usersPath)) {
      console.error('Users data file not found:', usersPath);
      return [];
    }
    
    const data = fs.readFileSync(usersPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading users:', err);
    return [];
  }
};

/**
 * Save users to the JSON file
 * @param {Array} users - Array of user objects to save
 */
const saveUsers = (users) => {
  try {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error saving users:', err);
  }
};

/**
 * Find a user by username
 * @param {string} username - Username to search for
 * @returns {Object|null} User object or null if not found
 */
exports.findByUsername = (username) => {
  const users = loadUsers();
  return users.find(u => u.username === username) || null;
};

/**
 * Find a user by ID
 * @param {string} id - User ID to search for
 * @returns {Object|null} User object or null if not found
 */
exports.findById = (id) => {
  const users = loadUsers();
  return users.find(u => u.id === id) || null;
};

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Password hash
 * @returns {Promise<boolean>} True if password matches
 */
exports.verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Object} Created user object
 */
exports.createUser = async (userData) => {
  const users = loadUsers();
  
  // Check if username is already taken
  if (users.find(u => u.username === userData.username)) {
    throw new Error('Username already exists');
  }
  
  // Generate a password hash
  const passwordHash = await bcrypt.hash(userData.password, 10);
  
  const newUser = {
    id: `u${String(users.length + 1).padStart(3, '0')}`,
    username: userData.username,
    email: userData.email,
    passwordHash,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role || 'loan_officer',
    tenantId: userData.tenantId,
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  
  users.push(newUser);
  saveUsers(users);
  
  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

/**
 * Update a user's last login time
 * @param {string} userId - User ID
 */
exports.updateLoginTime = (userId) => {
  const users = loadUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    users[userIndex].lastLogin = new Date().toISOString();
    saveUsers(users);
  }
};

/**
 * Get public user data (without sensitive info)
 * @param {Object} user - User object
 * @returns {Object} User object without sensitive fields
 */
exports.getPublicUserData = (user) => {
  if (!user) return null;
  
  const { passwordHash, ...publicUserData } = user;
  return publicUserData;
}; 