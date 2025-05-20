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
  AppBar,
  Toolbar,
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
      <AppBar position="static" color="primary" sx={{ mb: 3 }}>
        <Toolbar>
          <AccountBalanceIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Loan Officer Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl">
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
        >
          {selectedLoanDetails && (
            <>
              <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Loan Details: {selectedLoanDetails.loan_id}
                </Typography>
                <IconButton color="inherit" onClick={handleCloseDetails}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  {/* Loan Information */}
                  <Grid sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardHeader 
                        title="Loan Information" 
                        titleTypographyProps={{ variant: 'subtitle1' }}
                        sx={{ backgroundColor: 'primary.light', py: 1 }}
                      />
                      <CardContent sx={{ px: 2, pt: 2, pb: 1 }}>
                        <Grid container spacing={1}>
                          <Grid sx={{ width: '50%', p: 0.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <AttachMoneyIcon fontSize="small" color="primary" />
                              <Typography variant="body2" component="span" color="text.secondary">Amount:</Typography>
                            </Stack>
                            <Typography variant="body1" sx={{ fontWeight: 'medium', ml: 4 }}>
                              {formatCurrency(selectedLoanDetails.loan_amount)}
                            </Typography>
                          </Grid>
                          <Grid sx={{ width: '50%', p: 0.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TrendingUpIcon fontSize="small" color="primary" />
                              <Typography variant="body2" component="span" color="text.secondary">Interest Rate:</Typography>
                            </Stack>
                            <Typography variant="body1" sx={{ fontWeight: 'medium', ml: 4 }}>
                              {selectedLoanDetails.interest_rate}%
                            </Typography>
                          </Grid>
                          <Grid sx={{ width: '50%', p: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">Term Length:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {selectedLoanDetails.term_length} months
                            </Typography>
                          </Grid>
                          <Grid sx={{ width: '50%', p: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">Status:</Typography>
                            <Chip 
                              label={selectedLoanDetails.status} 
                              color={getStatusColor(selectedLoanDetails.status)}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Grid>
                          <Grid sx={{ width: '50%', p: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">Start Date:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {formatDate(selectedLoanDetails.start_date)}
                            </Typography>
                          </Grid>
                          <Grid sx={{ width: '50%', p: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">End Date:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {formatDate(selectedLoanDetails.end_date)}
                            </Typography>
                          </Grid>
                          <Grid sx={{ width: '50%', p: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">Type:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {selectedLoanDetails.loan_type}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Borrower Information */}
                  {selectedLoanDetails.borrower_details && (
                    <Grid sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardHeader 
                          title="Borrower Information" 
                          titleTypographyProps={{ variant: 'subtitle1' }}
                          sx={{ backgroundColor: 'primary.light', py: 1 }}
                        />
                        <CardContent sx={{ px: 2, pt: 2, pb: 1 }}>
                          <Grid container spacing={1}>
                            <Grid sx={{ width: '100%', p: 0.5 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <PersonIcon fontSize="small" color="primary" />
                                <Typography variant="body2" component="span" color="text.secondary">Name:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {selectedLoanDetails.borrower_details.first_name} {selectedLoanDetails.borrower_details.last_name}
                                </Typography>
                              </Stack>
                            </Grid>
                            <Grid sx={{ width: '100%', p: 0.5 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <EmailIcon fontSize="small" color="primary" />
                                <Typography variant="body2" component="span" color="text.secondary">Email:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {selectedLoanDetails.borrower_details.email}
                                </Typography>
                              </Stack>
                            </Grid>
                            <Grid sx={{ width: '100%', p: 0.5 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <PhoneIcon fontSize="small" color="primary" />
                                <Typography variant="body2" component="span" color="text.secondary">Phone:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {selectedLoanDetails.borrower_details.phone}
                                </Typography>
                              </Stack>
                            </Grid>
                            <Grid sx={{ width: '100%', p: 0.5 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <HomeIcon fontSize="small" color="primary" />
                                <Typography variant="body2" component="span" color="text.secondary">Address:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {selectedLoanDetails.borrower_details.address}
                                </Typography>
                              </Stack>
                            </Grid>
                            <Grid sx={{ width: '50%', p: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">Credit Score:</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {selectedLoanDetails.borrower_details.credit_score}
                              </Typography>
                            </Grid>
                            <Grid sx={{ width: '50%', p: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">Annual Income:</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {formatCurrency(selectedLoanDetails.borrower_details.income)}
                              </Typography>
                            </Grid>
                            <Grid sx={{ width: '50%', p: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">Farm Size:</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {selectedLoanDetails.borrower_details.farm_size} acres
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* Payment History */}
                  {selectedLoanDetails.payments && selectedLoanDetails.payments.length > 0 && (
                    <Grid sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardHeader 
                          title="Payment History" 
                          titleTypographyProps={{ variant: 'subtitle1' }}
                          sx={{ backgroundColor: 'primary.light', py: 1 }}
                        />
                        <CardContent sx={{ px: 0, py: 0 }}>
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
                    </Grid>
                  )}
                  
                  {/* Collateral Information */}
                  {selectedLoanDetails.collateral && selectedLoanDetails.collateral.length > 0 && (
                    <Grid sx={{ width: { xs: '100%', md: '50%' }, p: 1 }}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardHeader 
                          title="Collateral" 
                          titleTypographyProps={{ variant: 'subtitle1' }}
                          sx={{ backgroundColor: 'primary.light', py: 1 }}
                        />
                        <CardContent sx={{ px: 0, py: 0 }}>
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
                                    <Stack direction="row" spacing={1} alignItems="center">
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
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
};

export default Dashboard; 