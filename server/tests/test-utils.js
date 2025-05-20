const path = require('path');
const fs = require('fs');

/**
 * Helper function to load mock data from JSON files
 * @param {string} filename - The name of the mock data file without extension
 * @returns {Array|Object} The parsed mock data
 */
const getMockData = (filename) => {
  try {
    const filePath = path.join(__dirname, 'mock-data', `${filename}.json`);
    
    // Check if file exists first before trying to read it
    if (!fs.existsSync(filePath)) {
      console.warn(`Mock data file not found: ${filePath}`);
      return [];
    }
    
    // Read and parse the file
    const data = fs.readFileSync(filePath, 'utf8');
    
    if (!data || data.trim() === '') {
      return [];
    }
    
    try {
      return JSON.parse(data);
    } catch (parseError) {
      console.error(`Error parsing mock data for ${filename}: ${parseError.message}`);
      return [];
    }
  } catch (error) {
    console.error(`Error loading mock data for ${filename}: ${error.message}`);
    return [];
  }
};

// Set test environment
process.env.NODE_ENV = 'test';

module.exports = {
  getMockData
}; 