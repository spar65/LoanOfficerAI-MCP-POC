import React, { useState, useRef, useEffect } from 'react';
import mcpClient from '../mcp/client';
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
  Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import PaymentsIcon from '@mui/icons-material/Payments';
import AssessmentIcon from '@mui/icons-material/Assessment';

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { text: 'Hello! Ask about loan status, details, payments, collateral, active loans, or loans by borrower.', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // In production, replace rule-based parsing with an NLP service like Dialogflow or Rasa
  const parseMessage = (message) => {
    const lowerMsg = message.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Extract loan ID if present
    let loanId = null;
    const loanIdMatch = lowerMsg.match(/loan\s+(\w+)/) || lowerMsg.match(/loan[^\w]*([\w\d]+)/);
    if (loanIdMatch) {
      loanId = loanIdMatch[1];
      // Add L prefix if it's just numbers
      if (/^\d+$/.test(loanId)) {
        // Format with leading zeros if needed (e.g., 1 becomes L001)
        const numericPart = loanId.padStart(3, '0');
        loanId = `L${numericPart}`;
      }
    }
    
    if (lowerMsg.includes('status') && loanId) {
      return { action: 'getStatus', loanId };
    } else if (lowerMsg.includes('details') && loanId) {
      return { action: 'getDetails', loanId };
    } else if (lowerMsg.includes('payment') && loanId) {
      return { action: 'getPayments', loanId };
    } else if (lowerMsg.includes('collateral') && loanId) {
      return { action: 'getCollateral', loanId };
    } else if (lowerMsg.includes('active loans')) {
      return { action: 'getActiveLoans' };
    } else if (lowerMsg.includes('loans for')) {
      const borrower = lowerMsg.split('for')[1]?.trim();
      return { action: 'getLoansByBorrower', borrower };
    } else if (lowerMsg.includes('summary') || lowerMsg.includes('portfolio overview')) {
      return { action: 'getSummary' };
    } else {
      return { action: 'unknown' };
    }
  };

  // Format currency values
  const formatCurrency = (amount) => {
    return amount?.toLocaleString(undefined, { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    const parsed = parseMessage(input);
    let responseText;
    try {
      if (parsed.action === 'getStatus') {
        const status = await mcpClient.getLoanStatus(parsed.loanId);
        responseText = `The status of loan ${parsed.loanId} is ${status}.`;
      } else if (parsed.action === 'getDetails') {
        const details = await mcpClient.getLoanDetails(parsed.loanId);
        responseText = `Loan ${details.loan_id}:\nBorrower: ${details.borrower}\nAmount: ${formatCurrency(details.loan_amount)}\nInterest Rate: ${details.interest_rate}%\nTerm: ${details.term_length} months\nStatus: ${details.status}\nType: ${details.loan_type}`;
      } else if (parsed.action === 'getPayments') {
        const payments = await mcpClient.getLoanPayments(parsed.loanId);
        if (payments.length > 0) {
          responseText = `Payment history for loan ${parsed.loanId}:\n${payments.map(p => 
            `${p.payment_date}: ${formatCurrency(p.amount)} (${p.status})`
          ).join('\n')}`;
        } else {
          responseText = `No payments found for loan ${parsed.loanId}.`;
        }
      } else if (parsed.action === 'getCollateral') {
        const collateral = await mcpClient.getLoanCollateral(parsed.loanId);
        if (collateral.length > 0) {
          responseText = `Collateral for loan ${parsed.loanId}:\n${collateral.map(c => 
            `${c.description}: ${formatCurrency(c.value)}`
          ).join('\n')}`;
        } else {
          responseText = `No collateral found for loan ${parsed.loanId}.`;
        }
      } else if (parsed.action === 'getActiveLoans') {
        const activeLoans = await mcpClient.getActiveLoans();
        responseText = activeLoans.length > 0
          ? `Active loans: ${activeLoans.map(l => l.loan_id).join(', ')}`
          : 'No active loans found.';
      } else if (parsed.action === 'getLoansByBorrower') {
        const loans = await mcpClient.getLoansByBorrower(parsed.borrower);
        responseText = loans.length > 0
          ? `Loans for ${parsed.borrower}: ${loans.map(l => l.loan_id).join(', ')}`
          : `No loans found for ${parsed.borrower}.`;
      } else if (parsed.action === 'getSummary') {
        const summary = await mcpClient.getLoanSummary();
        responseText = `Loan Portfolio Summary:\nTotal Loans: ${summary.totalLoans}\nActive Loans: ${summary.activeLoans}\nTotal Amount: ${formatCurrency(summary.totalAmount)}\nDelinquency Rate: ${summary.delinquencyRate.toFixed(2)}%`;
      } else {
        responseText = "Sorry, I didn't understand. Try: 'status of loan L001', 'details of loan L002', 'payments for loan L001', 'collateral for loan L002', 'active loans', 'loans for John', or 'portfolio summary'.";
      }
    } catch (error) {
      console.error("API error:", error);
      responseText = 'Error fetching data. Please check the loan ID or try again.';
    }
    const botMessage = { text: responseText, sender: 'bot' };
    setMessages((prev) => [...prev, botMessage]);
    setInput('');
  };

  // Get icon for message based on content
  const getMessageIcon = (message) => {
    if (message.sender === 'user') {
      return <PersonIcon />;
    }
    
    const text = message.text.toLowerCase();
    if (text.includes('payment history')) {
      return <PaymentsIcon />;
    } else if (text.includes('collateral')) {
      return <DescriptionIcon />;
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
                    disabled={!input.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mr: 1 }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          <Chip 
            label="Active Loans" 
            size="small" 
            color="primary" 
            variant="outlined" 
            onClick={() => {
              setInput('Show me active loans');
              setTimeout(handleSend, 100);
            }}
          />
          <Chip 
            label="Portfolio Summary" 
            size="small" 
            color="primary" 
            variant="outlined" 
            onClick={() => {
              setInput('Portfolio summary');
              setTimeout(handleSend, 100);
            }} 
          />
          <Chip 
            label="Loan Status" 
            size="small" 
            color="primary" 
            variant="outlined" 
            onClick={() => setInput('Status of loan L001')} 
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Chatbot; 