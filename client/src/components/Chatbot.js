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
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';
import GroupIcon from '@mui/icons-material/Group';
import BuildIcon from '@mui/icons-material/Build';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';

// Define MCP function schemas for OpenAI
const MCP_FUNCTIONS = [
  {
    name: "getAllLoans",
    description: "Get a list of all loans in the system",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "getLoanDetails",
    description: "Get detailed information about a specific loan",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to retrieve",
        },
      },
      required: ["loan_id"],
    },
  },
  {
    name: "getLoanStatus",
    description: "Get the status of a specific loan",
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
    description: "Get a list of all active loans",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "getLoansByBorrower",
    description: "Get loans for a specific borrower by name",
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
    description: "Get summary statistics about all loans",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "getBorrowerDefaultRisk",
    description: "Calculate the probability of default for an agricultural borrower based on credit score, farm financials, and agricultural risk factors. Returns risk score, risk level, and contributing factors.",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower to assess for default risk",
        },
      },
      required: ["borrower_id"],
    },
  },
  {
    name: "evaluateCollateralSufficiency",
    description: "Determine if the collateral value is sufficient for a loan based on loan-to-value ratio, market conditions, and collateral type. Returns sufficiency assessment and recommendations.",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to evaluate collateral sufficiency for",
        },
      },
      required: ["loan_id"],
    },
  },
  {
    name: "getBorrowerNonAccrualRisk",
    description: "Evaluate the risk of a borrower's loans moving to non-accrual status based on payment history, credit profile, and agricultural factors. Returns risk level and recovery probability.",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower to assess for non-accrual risk",
        },
      },
      required: ["borrower_id"],
    },
  },
  {
    name: "assessCropYieldRisk",
    description: "Evaluate agricultural risk factors affecting crop yields for a specific borrower, including weather patterns, pest risks, and forecasted yields. Returns risk assessment and mitigation recommendations.",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower whose crop yield risk to assess"
        },
        crop_type: {
          type: "string",
          description: "Optional: The specific crop type to evaluate (e.g., corn, wheat, soybeans)",
        },
        season: {
          type: "string",
          description: "Optional: The growing season to evaluate (e.g., '2025', 'current')"
        }
      },
      required: ["borrower_id"]
    }
  },
  {
    name: "analyzeMarketPriceImpact",
    description: "Analyze the impact of market price changes on a specific borrower for a commodity",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "ID of the borrower to analyze market impact for"
        },
        commodity: {
          type: "string",
          description: "Name of the commodity (corn, wheat, soybeans, cotton, rice, livestock, dairy)"
        },
        price_change_percent: {
          type: "string",
          description: "Percentage change in commodity prices (e.g., '+10%', '-5%')"
        }
      },
      required: ["borrower_id", "commodity", "price_change_percent"]
    }
  },
  {
    name: "recommendLoanRestructuring",
    description: "Generate loan restructuring options for a specific loan based on borrower financial situation, market conditions, and loan performance. Provides various restructuring scenarios with pros and cons.",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to generate restructuring recommendations for"
        },
        restructuring_goal: {
          type: "string",
          description: "Optional: The primary goal of restructuring (e.g., 'reduce_payments', 'extend_term', 'address_hardship')"
        }
      },
      required: ["loan_id"]
    }
  }
];

const Chatbot = ({ onClose }) => {
  // Convert initial bot message to OpenAI format
  const [conversationHistory, setConversationHistory] = useState([
    { role: "system", content: "You are an AI Farm Loan Assistant. You help users find information about agricultural loans using the available MCP functions. Keep your responses concise and professional. Always format currency values and percentages correctly. If you don't know the answer, ask for clarification." },
    { role: "assistant", content: "Hello! I'm your Farm Loan Assistant. Ask me about loan status, details, payments, collateral, active loans, or loans by borrower." }
  ]);
  
  // For display in the UI
  const [messages, setMessages] = useState([
    { text: 'Hello! I\'m your Farm Loan Assistant. Ask me about loan status, details, payments, collateral, active loans, or loans by borrower.', sender: 'bot' },
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
          case 'evaluateCollateralSufficiency':
            // These functions take loan_id
            if (name === 'evaluateCollateralSufficiency') {
              console.log(`Calling collateral sufficiency evaluation for loan ${args.loan_id}`);
            }
            result = await mcpClient[name](args.loan_id);
            if (name === 'evaluateCollateralSufficiency') {
              console.log(`Collateral evaluation result:`, result);
            }
            break;
            
          case 'getLoansByBorrower':
            // Takes borrower name
            result = await mcpClient[name](args.borrower);
            break;
            
          case 'getBorrowerDefaultRisk':
          case 'getBorrowerNonAccrualRisk':
            // These functions take borrower_id
            console.log(`Calling risk assessment function: ${name} for borrower ${args.borrower_id}`);
            result = await mcpClient[name](args.borrower_id);
            console.log(`Risk assessment result:`, result);
            break;
            
          case 'recommendLoanRestructuring':
            // Takes loan_id and restructuring_goal
            console.log(`Generating loan restructuring recommendations for loan ${args.loan_id}, goal: ${args.restructuring_goal || 'general'}`);
            result = await mcpClient[name](args.loan_id, args.restructuring_goal);
            console.log('Loan restructuring recommendations:', result);
            break;
            
          case 'assessCropYieldRisk':
            console.log(`Assessing crop yield risk for borrower ${args.borrower_id}, crop: ${args.crop_type || 'all crops'}`);
            result = await mcpClient[name](
              args.borrower_id,
              args.crop_type || null,
              args.season || 'current'
            );
            console.log('Crop yield risk assessment result:', result);
            break;
            
          case 'analyzeMarketPriceImpact':
            console.log(`Analyzing market price impact for borrower ${args.borrower_id}, commodity: ${args.commodity}, change: ${args.price_change_percent || 'current projections'}`);
            result = await mcpClient[name](
              args.borrower_id,
              args.commodity,
              args.price_change_percent || null
            );
            console.log('Market price impact analysis result:', result);
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
    if (text.includes('payment history') || text.includes('payment patterns')) {
      return <PaymentsIcon />;
    } else if (text.includes('collateral')) {
      return <SecurityIcon />;
    } else if (text.includes('market price') || text.includes('price impact') || text.includes('commodity') || text.includes('corn') || text.includes('soybeans') || text.includes('wheat')) {
      return <ShowChartIcon />;
    } else if (text.includes('equipment maintenance') || text.includes('maintenance forecast')) {
      return <BuildIcon />;
    } else if (text.includes('refinancing') || text.includes('restructuring')) {
      return <TrendingUpIcon />;
    } else if (text.includes('high risk') || text.includes('risk farmers')) {
      return <WarningIcon />;
    } else if (text.includes('borrower details') || text.includes('borrower information')) {
      return <PersonIcon />;
    } else if (text.includes('loan details') || text.includes('loan information')) {
      return <InfoIcon />;
    } else if (text.includes('amount:')) {
      return <AttachMoneyIcon />;
    } else if (text.includes('portfolio summary')) {
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
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {/* Basic Loan Information */}
          <Typography variant="caption" sx={{ width: '100%', mt: 0.5, mb: 0.5, color: 'text.secondary' }}>
            Basic Loan Information:
          </Typography>
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
            label="Portfolio Summary" 
            size="small" 
            color="primary" 
            variant="outlined" 
            onClick={() => {
              setInput('Give me the portfolio summary');
              setTimeout(handleSend, 100);
            }} 
          />
          <Chip 
            label="Loan Status" 
            size="small" 
            color="primary" 
            variant="outlined" 
            onClick={() => setInput('What is the status of loan L001?')} 
          />
          <Chip 
            label="Payment History" 
            size="small" 
            color="primary" 
            variant="outlined" 
            icon={<HistoryIcon />}
            onClick={() => setInput('Show me payment history for loan L001')} 
          />
          <Chip 
            label="Collateral Details" 
            size="small" 
            color="primary" 
            variant="outlined" 
            icon={<SecurityIcon />}
            onClick={() => setInput('Show me collateral for loan L001')} 
          />
          <Chip 
            label="Loan Details" 
            size="small" 
            color="primary" 
            variant="outlined" 
            icon={<InfoIcon />}
            onClick={() => setInput('Show me details for loan L001')} 
          />
          <Chip 
            label="Borrower Loans" 
            size="small" 
            color="primary" 
            variant="outlined" 
            icon={<GroupIcon />}
            onClick={() => setInput('Show me loans for borrower B001')} 
          />
          
          {/* Risk Assessment */}
          <Typography variant="caption" sx={{ width: '100%', mt: 1, mb: 0.5, color: 'text.secondary' }}>
            Risk Assessment:
          </Typography>
          <Chip 
            label="Default Risk" 
            size="small" 
            color="error" 
            variant="outlined" 
            onClick={() => setInput('What is the default risk for borrower B001?')} 
          />
          <Chip 
            label="Collateral Evaluation" 
            size="small" 
            color="error" 
            variant="outlined" 
            onClick={() => setInput('Evaluate collateral sufficiency for loan L002')} 
          />
          <Chip 
            label="Non-Accrual Risk" 
            size="small" 
            color="error" 
            variant="outlined" 
            onClick={() => setInput('What is the non-accrual risk for borrower B003?')} 
          />
          <Chip 
            label="Borrower Details" 
            size="small" 
            color="error" 
            variant="outlined" 
            icon={<PersonIcon />}
            onClick={() => setInput('Show me details for borrower B001')} 
          />
          
          {/* Predictive Analytics */}
          <Typography variant="caption" sx={{ width: '100%', mt: 1, mb: 0.5, color: 'text.secondary' }}>
            Predictive Analytics:
          </Typography>
          <Chip 
            label="Crop Yield Risk" 
            size="small" 
            color="success" 
            variant="outlined" 
            onClick={() => setInput('Assess crop yield risk for borrower B002')} 
          />
          <Chip 
            label="Market Price Impact" 
            size="small" 
            color="success" 
            variant="outlined" 
            icon={<ShowChartIcon />}
            onClick={() => setInput('How will market prices impact borrower B001?')} 
          />
          <Chip 
            label="Loan Restructuring" 
            size="small" 
            color="success" 
            variant="outlined" 
            onClick={() => setInput('Recommend loan restructuring options for L003')} 
          />
          <Chip 
            label="Equipment Maintenance" 
            size="small" 
            color="success" 
            variant="outlined" 
            icon={<BuildIcon />}
            onClick={() => setInput('Forecast equipment maintenance for borrower B001')} 
          />
          <Chip 
            label="Refinancing Options" 
            size="small" 
            color="success" 
            variant="outlined" 
            icon={<TrendingUpIcon />}
            onClick={() => setInput('Get refinancing options for loan L001')} 
          />
          <Chip 
            label="Payment Patterns" 
            size="small" 
            color="success" 
            variant="outlined" 
            icon={<PaymentsIcon />}
            onClick={() => setInput('Analyze payment patterns for borrower B001')} 
          />
          <Chip 
            label="High Risk Farmers" 
            size="small" 
            color="success" 
            variant="outlined" 
            icon={<WarningIcon />}
            onClick={() => setInput('Show me high risk farmers')} 
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Chatbot;
export { MCP_FUNCTIONS }; 