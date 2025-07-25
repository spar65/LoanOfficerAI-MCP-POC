import React, { useState, useEffect } from 'react';
import mcpClient from '../mcp/client';

// Material UI imports
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent, 
  Container, 
  Divider, 
  Grid, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography, 
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LandscapeIcon from '@mui/icons-material/Landscape';
import ApartmentIcon from '@mui/icons-material/Apartment';

const Dashboard = () => {
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalAmount: 0,
    delinquencyRate: 0
  });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedLoanDetails, setSelectedLoanDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch loans
      const loansData = await mcpClient.getAllLoans();
      setLoans(loansData);
      
      // Fetch summary statistics
      try {
        const summaryData = await mcpClient.getLoanSummary();
        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching summary data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Fetch detailed loan information when a loan is selected
  useEffect(() => {
    const fetchLoanDetails = async () => {
      if (!selectedLoan) {
        setSelectedLoanDetails(null);
        return;
      }
      
      setLoading(true);
      try {
        const details = await mcpClient.getLoanDetails(selectedLoan.loan_id);
        setSelectedLoanDetails(details);
        setDetailsOpen(true);
      } catch (error) {
        console.error('Error fetching loan details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLoanDetails();
  }, [selectedLoan]);

  const handleSelectLoan = (loan) => {
    setSelectedLoan(loan);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedLoan(null);
  };

  // Function to format a date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Function to format currency
  const formatCurrency = (amount) => {
    return amount?.toLocaleString(undefined, { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Closed':
        return 'default';
      case 'Late':
        return 'error';
      case 'On Time':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid sx={{ width: { xs: '100%', md: '25%' }, p: 1 }}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CreditCardIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {summary.totalLoans}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Loans
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid sx={{ width: { xs: '100%', md: '25%' }, p: 1 }}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {summary.activeLoans}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Loans
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid sx={{ width: { xs: '100%', md: '25%' }, p: 1 }}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoneyIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {formatCurrency(summary.totalAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid sx={{ width: { xs: '100%', md: '25%' }, p: 1 }}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WarningIcon color={summary.delinquencyRate > 20 ? "error" : "warning"} sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {summary.delinquencyRate?.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Delinquency Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="body1" color="text.secondary" paragraph>
          View your loan portfolio below. Click on any loan to see detailed information.
        </Typography>
        
        {/* Loans Table */}
        <TableContainer component={Paper} elevation={3} sx={{ mb: 4 }}>
          <Table sx={{ minWidth: 650 }} aria-label="loan table">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell>Loan ID</TableCell>
                <TableCell>Borrower</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Interest Rate</TableCell>
                <TableCell align="right">Term</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loans.map((loan) => (
                <TableRow 
                  key={loan.loan_id} 
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{loan.loan_id}</TableCell>
                  <TableCell>{loan.borrower}</TableCell>
                  <TableCell align="right">{formatCurrency(loan.loan_amount)}</TableCell>
                  <TableCell align="right">{loan.interest_rate}%</TableCell>
                  <TableCell align="right">{loan.term_length} months</TableCell>
                  <TableCell>
                    <Chip 
                      label={loan.status} 
                      color={getStatusColor(loan.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{loan.loan_type}</TableCell>
                  <TableCell align="center">
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => handleSelectLoan(loan)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Loan Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={handleCloseDetails}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: { overflow: 'visible' }
          }}
        >
          {selectedLoanDetails && (
            <>
              <DialogTitle 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 1.5
                }}
              >
                <Typography variant="h6">
                  Loan Details: {selectedLoanDetails.loan_id}
                </Typography>
                <IconButton color="inherit" onClick={handleCloseDetails} size="small">
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ p: 1 }}>
                {/* Two-column layout */}
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                  {/* Left Column */}
                  <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Loan Information */}
                    <Card variant="outlined">
                      <CardHeader 
                        title="Loan Information" 
                        titleTypographyProps={{ variant: 'subtitle1' }}
                        sx={{ backgroundColor: 'primary.light', py: 0.75, px: 1.5 }}
                      />
                      <CardContent sx={{ px: 1.5, py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <AttachMoneyIcon fontSize="small" color="primary" />
                          <Typography variant="body2" component="span" color="text.secondary">Amount:</Typography>
                          <Typography variant="body1">{formatCurrency(selectedLoanDetails.loan_amount)}</Typography>
                          
                          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                            <TrendingUpIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" component="span" color="text.secondary">Interest Rate:</Typography>
                            <Typography variant="body1" sx={{ ml: 0.5 }}>{selectedLoanDetails.interest_rate}%</Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 0.5 }}>Term Length:</Typography>
                          <Typography variant="body1" sx={{ mr: 2 }}>{selectedLoanDetails.term_length} months</Typography>
                          
                          <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 0.5 }}>Status:</Typography>
                          <Chip 
                            label={selectedLoanDetails.status} 
                            color={getStatusColor(selectedLoanDetails.status)}
                            size="small"
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 0.5 }}>Start Date:</Typography>
                          <Typography variant="body1" sx={{ mr: 2 }}>{formatDate(selectedLoanDetails.start_date)}</Typography>
                          
                          <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 0.5 }}>End Date:</Typography>
                          <Typography variant="body1">{formatDate(selectedLoanDetails.end_date)}</Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 0.5 }}>Type:</Typography>
                          <Typography variant="body1">{selectedLoanDetails.loan_type}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                    
                    {/* Payment History */}
                    {selectedLoanDetails.payments && selectedLoanDetails.payments.length > 0 && (
                      <Card variant="outlined">
                        <CardHeader 
                          title="Payment History" 
                          titleTypographyProps={{ variant: 'subtitle1' }}
                          sx={{ backgroundColor: 'primary.light', py: 0.75, px: 1.5 }}
                        />
                        <CardContent sx={{ p: 0 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedLoanDetails.payments.map(payment => (
                                <TableRow key={payment.payment_id}>
                                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                  <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={payment.status} 
                                      color={getStatusColor(payment.status)}
                                      size="small"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </Box>
                  
                  {/* Right Column */}
                  <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Borrower Information */}
                    {selectedLoanDetails.borrower_details && (
                      <Card variant="outlined">
                        <CardHeader 
                          title="Borrower Information" 
                          titleTypographyProps={{ variant: 'subtitle1' }}
                          sx={{ backgroundColor: 'primary.light', py: 0.75, px: 1.5 }}
                        />
                        <CardContent sx={{ px: 1.5, py: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <PersonIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 0.5 }}>Name:</Typography>
                            <Typography variant="body1">
                              {selectedLoanDetails.borrower_details.first_name} {selectedLoanDetails.borrower_details.last_name}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <EmailIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 0.5 }}>Email:</Typography>
                            <Typography variant="body1">
                              {selectedLoanDetails.borrower_details.email}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <PhoneIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 0.5 }}>Phone:</Typography>
                            <Typography variant="body1">
                              {selectedLoanDetails.borrower_details.phone}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <HomeIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" component="span" color="text.secondary" sx={{ mr: 0.5 }}>Address:</Typography>
                            <Typography variant="body1">
                              {selectedLoanDetails.borrower_details.address}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ mr: 2 }}>
                              <Typography variant="body2" color="text.secondary">Credit Score:</Typography>
                              <Typography variant="body1">
                                {selectedLoanDetails.borrower_details.credit_score}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ mr: 2 }}>
                              <Typography variant="body2" color="text.secondary">Annual Income:</Typography>
                              <Typography variant="body1">
                                {formatCurrency(selectedLoanDetails.borrower_details.income)}
                              </Typography>
                            </Box>
                            
                            <Box>
                              <Typography variant="body2" color="text.secondary">Farm Size:</Typography>
                              <Typography variant="body1">
                                {selectedLoanDetails.borrower_details.farm_size} acres
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Collateral Information */}
                    {selectedLoanDetails.collateral && selectedLoanDetails.collateral.length > 0 && (
                      <Card variant="outlined">
                        <CardHeader 
                          title="Collateral" 
                          titleTypographyProps={{ variant: 'subtitle1' }}
                          sx={{ backgroundColor: 'primary.light', py: 0.75, px: 1.5 }}
                        />
                        <CardContent sx={{ p: 0 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Value</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedLoanDetails.collateral.map(collateral => (
                                <TableRow key={collateral.collateral_id}>
                                  <TableCell>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                      <LandscapeIcon fontSize="small" color="primary" />
                                      <Typography variant="body2">
                                        {collateral.description}
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell align="right">{formatCurrency(collateral.value)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </Box>
                </Box>
              </DialogContent>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
};

export default Dashboard; 