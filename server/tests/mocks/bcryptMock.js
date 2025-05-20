/**
 * Mock implementation of bcrypt for tests
 */
module.exports = {
  /**
   * Mock hash function - creates a deterministic hash
   * @param {string} password - Password to hash
   * @param {number} saltRounds - Number of salt rounds
   * @returns {Promise<string>} - Hashed password
   */
  hash: async (password, saltRounds) => {
    // Simple mock just for testing - not secure!
    return `hashed_${password}_${saltRounds}`;
  },
  
  /**
   * Mock compare function
   * @param {string} password - Password to check
   * @param {string} hash - Hash to compare against
   * @returns {Promise<boolean>} - True if password is 'password123'
   */
  compare: async (password, hash) => {
    // For tests, only the correct password is 'password123'
    return password === 'password123';
  }
}; 