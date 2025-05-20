import React, { useState, useRef, useEffect } from 'react';
import mcpClient from '../mcp/client';
import axios from 'axios';
import authService from '../mcp/authService';  // Import auth service
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Card,
  CardContent,
  InputAdornment,
  List,
  ListItem,
  Divider,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import PaymentsIcon from '@mui/icons-material/Payments';
import AssessmentIcon from '@mui/icons-material/Assessment';

// Define advanced MCP function schemas for OpenAI
export const MCP_FUNCTIONS = [
  // Basic loan data retrieval functions
  {
    name: "getAllLoans",
    description: "Get a list of all loans in the system",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "getLoanDetails",
    description: "Get detailed information about a specific loan including borrower, amount, interest rate, term, status, and type",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to retrieve (e.g., L001, L002)",
        },
      },
      required: ["loan_id"],
    },
  },
  {
    name: "getLoanStatus",
    description: "Get the current status of a specific loan (Active, Pending, Closed, Late)",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to retrieve the status for",
        },
      },
      required: ["loan_id"],
    },
  },
  {
    name: "getActiveLoans",
    description: "Get a list of all currently active loans",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "getLoansByBorrower",
    description: "Get loans for a specific borrower by their name",
    parameters: {
      type: "object",
      properties: {
        borrower: {
          type: "string",
          description: "The name of the borrower to retrieve loans for",
        },
      },
      required: ["borrower"],
    },
  },
  {
    name: "getLoanPayments",
    description: "Get payment history for a specific loan",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to retrieve payment history for",
        },
      },
      required: ["loan_id"],
    },
  },
  {
    name: "getLoanCollateral",
    description: "Get collateral information for a specific loan",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to retrieve collateral for",
        },
      },
      required: ["loan_id"],
    },
  },
  {
    name: "getLoanSummary",
    description: "Get summary statistics about all loans including total count, active count, total amount, and delinquency rate",
    parameters: { type: "object", properties: {}, required: [] },
  },
  
  // Advanced risk assessment and analytics functions
  {
    name: "assessDefaultRisk",
    description: "Analyze default risk for a specific borrower based on payment history, crop types, weather patterns, and financial indicators",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower to assess (e.g., B001, B002)",
        },
        time_horizon: {
          type: "string",
          enum: ["short_term", "medium_term", "long_term"],
          description: "The time horizon for risk assessment (short_term = 3 months, medium_term = 1 year, long_term = 3+ years)"
        }
      },
      required: ["borrower_id"]
    }
  },
  {
    name: "analyzePaymentPatterns",
    description: "Analyze payment patterns for a borrower to identify seasonality, consistency, and potential issues",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower to analyze payment patterns for"
        },
        period: {
          type: "string",
          description: "The period to analyze (e.g., '1y' for 1 year, '6m' for 6 months)",
          default: "1y"
        }
      },
      required: ["borrower_id"]
    }
  },
  {
    name: "findFarmersAtRisk",
    description: "Find farmers at risk of default based on various criteria like crop type, region, or time period",
    parameters: {
      type: "object",
      properties: {
        crop_type: {
          type: "string",
          description: "The type of crop to filter by (e.g., corn, wheat, soybeans)",
        },
        season: {
          type: "string",
          enum: ["spring", "summer", "fall", "winter"],
          description: "The season to consider for risk assessment"
        },
        risk_level: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "The minimum risk level to include"
        }
      }
    }
  },
  {
    name: "evaluateCollateralSufficiency",
    description: "Evaluate if the collateral for a loan is sufficient based on current market conditions",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to evaluate collateral for"
        },
        market_conditions: {
          type: "string",
          enum: ["stable", "declining", "improving"],
          description: "Current market conditions affecting collateral value",
          default: "stable"
        }
      },
      required: ["loan_id"]
    }
  },
  {
    name: "recommendRefinancingOptions",
    description: "Recommend refinancing options for a specific loan based on current interest rates and borrower history",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to suggest refinancing options for"
        }
      },
      required: ["loan_id"]
    }
  },
  
  // New predictive analytics functions
  {
    name: "predictDefaultRisk",
    description: "Predict the probability of loan default for a specific borrower over a given time horizon",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower to analyze default risk for"
        },
        time_horizon: {
          type: "string",
          description: "The time horizon for the prediction: 3m (3 months), 6m (6 months), or 1y (1 year)",
          enum: ["3m", "6m", "1y"],
          default: "3m"
        }
      },
      required: ["borrower_id"]
    }
  },
  {
    name: "predictNonAccrualRisk",
    description: "Predict the probability of a borrower becoming non-accrual and the likelihood of recovery",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower to analyze non-accrual risk for"
        }
      },
      required: ["borrower_id"]
    }
  },
  {
    name: "forecastEquipmentMaintenance",
    description: "Forecast equipment maintenance costs for a borrower over a specific time period",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower to forecast equipment maintenance costs for"
        },
        time_horizon: {
          type: "string",
          description: "The time horizon for the forecast: 1y (1 year), 2y (2 years), or 3y (3 years)",
          enum: ["1y", "2y", "3y"],
          default: "1y"
        }
      },
      required: ["borrower_id"]
    }
  },
  {
    name: "assessCropYieldRisk",
    description: "Assess the risk of crop yields falling below break-even point based on historical data and current conditions",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower to assess crop yield risk for"
        },
        crop_type: {
          type: "string",
          description: "The specific crop type to analyze (e.g., corn, soybeans, wheat); if omitted, all crops will be analyzed"
        },
        season: {
          type: "string",
          description: "The growing season to analyze: current or next",
          enum: ["current", "next"],
          default: "current"
        }
      },
      required: ["borrower_id"]
    }
  },
  {
    name: "analyzeMarketPriceImpact",
    description: "Analyze the impact of commodity price changes on a borrower's income and loan repayment ability",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower to analyze market price impact for"
        },
        commodity_types: {
          type: "array",
          description: "Specific commodities to analyze (e.g., corn, soybeans); if omitted, all relevant commodities will be analyzed",
          items: {
            type: "string"
          }
        }
      },
      required: ["borrower_id"]
    }
  },
  {
    name: "recommendLoanRestructuring",
    description: "Recommend optimal loan restructuring options to minimize default risk for a borrower",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to recommend restructuring options for"
        },
        optimization_goal: {
          type: "string",
          description: "The primary goal of the restructuring",
          enum: ["lower_payments", "shorter_term", "reduce_interest", "improve_cash_flow"],
          default: "lower_payments"
        }
      },
      required: ["loan_id"]
    }
  }
];

const Chatbot = ({ onClose }) => {
  // Agricultural lending domain knowledge system prompt
  const systemPrompt = `You are an AI Farm Loan Assistant specializing in agricultural lending. Help users understand their loan portfolio, assess risks, and make informed lending decisions.

DOMAIN KNOWLEDGE:
- Agricultural loans are affected by seasonal cash flow, with farmers often receiving most income after harvest
- Weather conditions, crop prices, and input costs significantly impact a farmer's ability to repay loans
- Payment history patterns often follow seasonal trends in farming operations
- Collateral typically includes land, equipment, and sometimes future crop yields
- Default risk increases with multiple late payments, especially those outside normal seasonal patterns
- Farm size, crop diversity, and equipment condition are key factors in risk assessment

AVAILABLE DATA:
- Loan details: terms, interest rates, payment schedules, and current status
- Borrower information: credit scores, farm size, crops grown, and financial statements
- Payment histories showing patterns and potential delinquencies
- Collateral records with valuations and condition reports
- Predictive analytics for default risk, non-accrual risk, equipment maintenance, and crop yield forecasts
- Market price impact analysis and loan restructuring recommendations

USE APPROPRIATE FUNCTIONS:
- For basic loan questions, use getLoanDetails, getLoanStatus, or getLoansByBorrower
- For default prediction, use predictDefaultRisk with a borrower_id and optional time horizon
- For non-accrual risk analysis, use predictNonAccrualRisk with a borrower_id
- For equipment maintenance forecasts, use forecastEquipmentMaintenance with a borrower_id and time horizon
- For crop yield risk assessment, use assessCropYieldRisk with a borrower_id and optional crop_type
- For market price impact analysis, use analyzeMarketPriceImpact with a borrower_id
- For loan restructuring recommendations, use recommendLoanRestructuring with a loan_id

EXAMPLE COMPLEX QUESTIONS YOU CAN ANSWER:
- "Which farmers are at high risk of default in the next 3 months?"
- "Will John Smith become non-accrual given his payment history?"
- "How much should borrower B002 budget for equipment maintenance next year?"
- "What's the likelihood of crop yields falling below break-even for Smith Farms?"
- "How will current corn price trends impact Sarah Johnson's income?"
- "What are the best restructuring options for loan L003?"
- "Should I be concerned about the collateral for William Brown's loans?"

Always provide clear, actionable information with data-driven insights. For complex questions, use the appropriate predictive function to provide accurate forecasts and recommendations.`;

  // Convert initial bot message to OpenAI format
  const [conversationHistory, setConversationHistory] = useState([
    { role: "system", content: systemPrompt },
    { role: "assistant", content: "Hello! I'm your Farm Loan Assistant. Ask me about loan status, details, payments, collateral, active loans, or loans by borrower. I can also help with risk assessment and refinancing options." }
  ]);
  
  // For display in the UI
  const [messages, setMessages] = useState([
    { text: 'Hello! I\'m your Farm Loan Assistant. Ask me about loan status, details, payments, collateral, active loans, or loans by borrower. I can also help with risk assessment and refinancing options.', sender: 'bot' },
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format currency values
  const formatCurrency = (amount) => {
    return amount?.toLocaleString(undefined, { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  // Process function calls from OpenAI
  const processFunctionCall = async (functionCall) => {
    try {
      const { name, arguments: argsString } = functionCall;
      console.log(`Executing function: ${name} with args: ${argsString}`);
      
      // Parse function arguments
      const args = JSON.parse(argsString);
      console.log('Parsed args:', args);
      
      // Execute the appropriate function based on the name
      if (typeof mcpClient[name] === 'function') {
        let result;
        
        // Call with appropriate arguments based on function name
        switch(name) {
          case 'getAllLoans':
          case 'getActiveLoans':
          case 'getLoanSummary':
            // These functions take no arguments
            result = await mcpClient[name]();
            break;
            
          case 'getLoanStatus':
          case 'getLoanDetails':
          case 'getLoanPayments':
          case 'getLoanCollateral':
            // These functions take loan_id
            result = await mcpClient[name](args.loan_id);
            break;
            
          case 'getLoansByBorrower':
            // Takes borrower name
            result = await mcpClient[name](args.borrower);
            break;
          
          // Added cases for new predictive functions
          case 'predictDefaultRisk':
            result = await mcpClient[name](args.borrower_id, args.time_horizon || '3m');
            break;
          
          case 'predictNonAccrualRisk':
            result = await mcpClient[name](args.borrower_id);
            break;
          
          case 'forecastEquipmentMaintenance':
            result = await mcpClient[name](args.borrower_id, args.time_horizon || '1y');
            break;
          
          case 'assessCropYieldRisk':
            result = await mcpClient[name](args.borrower_id, {
              cropType: args.crop_type,
              season: args.season || 'current'
            });
            break;
          
          case 'analyzeMarketPriceImpact':
            result = await mcpClient[name](args.borrower_id, args.commodity_types || []);
            break;
          
          case 'recommendLoanRestructuring':
            result = await mcpClient[name](args.loan_id, args.optimization_goal || 'lower_payments');
            break;
          
          case 'analyzePaymentPatterns':
            // This would analyze payment data for patterns
            result = await mcpClient.analyzePaymentPatterns(args.borrower_id, args.period || "1y");
            break;
          
          case 'findFarmersAtRisk':
            // This would find farmers matching risk criteria
            result = await mcpClient.findFarmersAtRisk(args.crop_type, args.season, args.risk_level);
            break;
          
          case 'evaluateCollateralSufficiency':
            // This would evaluate if collateral is sufficient
            result = await mcpClient.evaluateCollateralSufficiency(args.loan_id, args.market_conditions || 'stable');
            break;
          
          case 'recommendRefinancingOptions':
            // This would recommend refinancing options
            result = await mcpClient.recommendLoanRestructuring(args.loan_id);
            break;
          
          default:
            throw new Error(`Unsupported function: ${name}`);
        }
        
        console.log(`Function ${name} executed successfully`);
        return { role: "function", name, content: JSON.stringify(result) };
      } else {
        throw new Error(`Function ${name} not found in mcpClient`);
      }
    } catch (error) {
      console.error("Error executing function:", error);
      return { 
        role: "function", 
        name: functionCall.name, 
        content: JSON.stringify({ error: error.message }) 
      };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = { text: input, sender: 'user' };
    const userMessageForAPI = { role: "user", content: input };
    
    setMessages(prev => [...prev, userMessage]);
    setConversationHistory(prev => [...prev, userMessageForAPI]);
    setInput('');
    setLoading(true);
    
    try {
      // Get auth token using the auth service
      const token = authService.getToken();
      
      if (!token) {
        console.error('No authentication token available');
        throw new Error('Authentication required');
      }
      
      // Add typing indicator
      setMessages(prev => [...prev, { text: '...', sender: 'bot', isTyping: true }]);
      
      // Make API request to our OpenAI proxy
      const response = await axios.post(`${mcpClient.baseURL}/openai/chat`, {
        messages: [...conversationHistory, userMessageForAPI],
        functions: MCP_FUNCTIONS,
        function_call: 'auto'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      // Handle the response
      const aiMessage = response.data;
      let responseText = aiMessage.content;
      let updatedHistory = [...conversationHistory, userMessageForAPI, aiMessage];
      
      // Handle function call if present
      if (aiMessage.function_call) {
        // Execute the function
        const functionResult = await processFunctionCall(aiMessage.function_call);
        updatedHistory.push(functionResult);
        
        // Get a second response from OpenAI that incorporates the function result
        const secondResponse = await axios.post(`${mcpClient.baseURL}/openai/chat`, {
          messages: updatedHistory,
          functions: MCP_FUNCTIONS,
          function_call: 'auto'
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Update with the final response
        const finalAiMessage = secondResponse.data;
        responseText = finalAiMessage.content;
        updatedHistory.push(finalAiMessage);
      }
      
      // Add final message to UI
      const botMessage = { text: responseText, sender: 'bot' };
      setMessages(prev => [...prev.filter(msg => !msg.isTyping), botMessage]);
      
      // Update conversation history
      setConversationHistory(updatedHistory);
      
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      // Add error message
      const errorMessage = { 
        text: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.`, 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Get icon for message based on content
  const getMessageIcon = (message) => {
    if (message.sender === 'user') {
      return <PersonIcon />;
    }
    
    if (message.isTyping) {
      return <CircularProgress size={20} />;
    }
    
    const text = message.text.toLowerCase();
    if (text.includes('payment') || text.includes('history')) {
      return <PaymentsIcon />;
    } else if (text.includes('collateral')) {
      return <DescriptionIcon />;
    } else if (text.includes('amount:') || text.includes('$')) {
      return <AttachMoneyIcon />;
    } else if (text.includes('risk') || text.includes('summary') || text.includes('analysis')) {
      return <AssessmentIcon />;
    }
    
    return <SmartToyIcon />;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        p: 2, 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          AI Farm Loan Assistant
        </Typography>
      </Box>
      
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2,
        bgcolor: '#f5f5f5'
      }}>
        <List>
          {messages.map((msg, idx) => (
            <ListItem 
              key={idx} 
              sx={{ 
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 1,
                alignItems: 'flex-start'
              }}
            >
              <Card 
                elevation={1}
                sx={{ 
                  maxWidth: '80%',
                  bgcolor: msg.sender === 'user' ? 'primary.light' : 'background.paper',
                  borderRadius: '12px',
                  borderTopRightRadius: msg.sender === 'user' ? 0 : '12px',
                  borderTopLeftRadius: msg.sender === 'user' ? '12px' : 0,
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                    <Box sx={{ 
                      mr: 1, 
                      display: 'flex', 
                      color: msg.sender === 'user' ? 'primary.dark' : 'primary.main'
                    }}>
                      {getMessageIcon(msg)}
                    </Box>
                    <Box>
                      {msg.text.split('\n').map((line, i) => (
                        <Typography 
                          key={i} 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                            fontWeight: i === 0 ? 500 : 400
                          }}
                        >
                          {line}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Box>
      
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask about loans..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    color="primary" 
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                  >
                    {loading ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mr: 1 }}
          />
        </Box>
        
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            EXAMPLE QUERIES
          </Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Basic Loan Information:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
            <Chip 
              label="Active Loans" 
              size="small" 
              color="primary" 
              variant="outlined" 
              onClick={() => {
                setInput('Show me all active loans');
                setTimeout(handleSend, 100);
              }}
            />
            <Chip 
              label="Loan Details" 
              size="small" 
              color="primary" 
              variant="outlined" 
              onClick={() => {
                setInput('What are the details of loan L001?');
                setTimeout(handleSend, 100);
              }} 
            />
            <Chip 
              label="Loan Status" 
              size="small" 
              color="primary" 
              variant="outlined" 
              onClick={() => {
                setInput('What\'s the status of loan L003?');
                setTimeout(handleSend, 100);
              }} 
            />
            <Chip 
              label="Borrower Loans" 
              size="small" 
              color="primary" 
              variant="outlined" 
              onClick={() => {
                setInput('Show me all loans for John Doe');
                setTimeout(handleSend, 100);
              }} 
            />
            <Chip 
              label="Portfolio Summary" 
              size="small" 
              color="primary" 
              variant="outlined" 
              onClick={() => {
                setInput('Give me a summary of our loan portfolio');
                setTimeout(handleSend, 100);
              }} 
            />
          </Box>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Risk Assessment:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
            <Chip 
              label="Default Risk" 
              size="small" 
              color="warning" 
              variant="outlined" 
              onClick={() => {
                setInput('What\'s the default risk for borrower B003 in the next 3 months?');
                setTimeout(handleSend, 100);
              }}
            />
            <Chip 
              label="Non-Accrual Risk" 
              size="small" 
              color="warning" 
              variant="outlined" 
              onClick={() => {
                setInput('Is there a risk that borrower B001 will become non-accrual?');
                setTimeout(handleSend, 100);
              }} 
            />
            <Chip 
              label="High-Risk Farmers" 
              size="small" 
              color="warning" 
              variant="outlined" 
              onClick={() => {
                setInput('Which farmers are at high risk of default?');
                setTimeout(handleSend, 100);
              }} 
            />
            <Chip 
              label="Collateral Sufficiency" 
              size="small" 
              color="warning" 
              variant="outlined" 
              onClick={() => {
                setInput('Is the collateral for loan L002 sufficient given current market conditions?');
                setTimeout(handleSend, 100);
              }} 
            />
          </Box>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Predictive Analytics:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
            <Chip 
              label="Equipment Costs" 
              size="small" 
              color="info" 
              variant="outlined" 
              onClick={() => {
                setInput('How much should borrower B002 budget for equipment maintenance next year?');
                setTimeout(handleSend, 100);
              }}
            />
            <Chip 
              label="Crop Yield Risk" 
              size="small" 
              color="info" 
              variant="outlined" 
              onClick={() => {
                setInput('What\'s the likelihood that borrower B005\'s crops will yield below break-even?');
                setTimeout(handleSend, 100);
              }} 
            />
            <Chip 
              label="Market Impact" 
              size="small" 
              color="info" 
              variant="outlined" 
              onClick={() => {
                setInput('How will current corn prices impact borrower B004\'s income?');
                setTimeout(handleSend, 100);
              }} 
            />
            <Chip 
              label="Refinancing Options" 
              size="small" 
              color="info" 
              variant="outlined" 
              onClick={() => {
                setInput('What are the best refinancing options for loan L005?');
                setTimeout(handleSend, 100);
              }} 
            />
            <Chip 
              label="Payment Patterns" 
              size="small" 
              color="info" 
              variant="outlined" 
              onClick={() => {
                setInput('What payment patterns do we see for borrower B001? Are they seasonal?');
                setTimeout(handleSend, 100);
              }} 
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Chatbot; 