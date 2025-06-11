#!/bin/bash
# Logging Tests Runner
# This script runs the logging tests with different configurations

# Enable colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}     RUNNING LOGGING VALIDATION TESTS${NC}"
echo -e "${BLUE}=======================================${NC}"

# Ensure logs directory exists
mkdir -p logs

# Make sure we have the required packages
echo -e "\n${YELLOW}Checking for required packages...${NC}"
if ! npm list winston | grep -q winston; then
  echo "Installing winston..."
  npm install winston
fi

if ! npm list uuid | grep -q uuid; then
  echo "Installing uuid..."
  npm install uuid
fi

# 1. Run with file logging enabled
echo -e "\n${YELLOW}Running tests with file logging enabled...${NC}"
export ENABLE_FILE_LOGGING=true
node tests/unit/test-logging-validation.js
FILE_TEST_RESULT=$?

# Print summary
echo -e "\n${BLUE}=======================================${NC}"
echo -e "${BLUE}           TEST SUMMARY${NC}"
echo -e "${BLUE}=======================================${NC}"

if [ $FILE_TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ Enhanced logging validation tests passed${NC}"
else
  echo -e "${RED}✗ Enhanced logging validation tests failed${NC}"
fi

# Check log files
echo -e "\n${YELLOW}Checking log files...${NC}"
if [ -f "logs/combined.log" ]; then
  echo -e "${GREEN}✓ combined.log exists${NC}"
  LOG_SIZE=$(wc -l "logs/combined.log" | awk '{print $1}')
  echo -e "  Lines: ${LOG_SIZE}"
else
  echo -e "${RED}✗ combined.log does not exist${NC}"
fi

if [ -f "logs/error.log" ]; then
  echo -e "${GREEN}✓ error.log exists${NC}"
  LOG_SIZE=$(wc -l "logs/error.log" | awk '{print $1}')
  echo -e "  Lines: ${LOG_SIZE}"
else
  echo -e "${RED}✗ error.log does not exist${NC}"
fi

if [ -f "logs/mcp.log" ]; then
  echo -e "${GREEN}✓ mcp.log exists${NC}"
  LOG_SIZE=$(wc -l "logs/mcp.log" | awk '{print $1}')
  echo -e "  Lines: ${LOG_SIZE}"
else
  echo -e "${RED}✗ mcp.log does not exist${NC}"
fi

echo -e "\n${BLUE}=======================================${NC}"
echo -e "${YELLOW}Log files are available in: logs/${NC}"
echo -e "${BLUE}=======================================${NC}"

# Exit with success if all tests passed
if [ $FILE_TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
fi 