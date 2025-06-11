import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Drawer, IconButton, Box, Button, Snackbar, Alert, Toolbar, AppBar, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import Fab from '@mui/material/Fab';
import Dashboard from './components/Dashboard';
import Chatbot from './components/Chatbot';
import SystemStatus from './components/SystemStatus';
import Login from './components/Login';
import authService from './mcp/authService';
import mcpClient from './mcp/client';
import farmTheme from './theme';
import './App.css';

function App() {
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  
  // Check server health on component mount
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const health = await mcpClient.checkHealth();
        setServerStatus(health ? 'online' : 'offline');
        console.log('Server status:', health ? 'online' : 'offline');
        
        if (!health) {
          setAlert({
            open: true,
            message: 'Warning: API server seems to be offline. Data may not load correctly.',
            severity: 'warning'
          });
        }
      } catch (error) {
        console.error('Failed to check server health:', error);
        setServerStatus('offline');
        setAlert({
          open: true,
          message: 'Error: Cannot connect to API server. Please check the server is running.',
          severity: 'error'
        });
      }
    };
    
    checkServerHealth();
  }, []);
  
  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = authService.isAuthenticated();
      console.log('Authentication check:', isAuth);
      
      // Log current auth status to debug
      authService.logAuthStatus();
      
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        setUser(authService.getUser());
      } else {
        // Auto-login for development/demo purposes
        console.log('No valid auth found, attempting auto-login...');
        try {
          const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: 'john.doe',
              password: 'password123'
            })
          });
          
          if (response.ok) {
            const authData = await response.json();
            console.log('Auto-login successful');
            const success = authService.setAuth(authData);
            
            if (success) {
              setIsAuthenticated(true);
              setUser(authData.user);
              setAlert({
                open: true,
                message: 'Automatically logged in for demo purposes',
                severity: 'info'
              });
            }
          } else {
            console.warn('Auto-login failed:', response.status);
          }
        } catch (error) {
          console.error('Auto-login error:', error);
        }
      }
    };
    
    checkAuth();
  }, []);
  
  useEffect(() => {
    // Function to handle mouse movement
    const handleMouseMove = (e) => {
      const threshold = window.innerWidth - 50; // 50px from the right edge
      
      // If the mouse is near the right edge of the screen
      if (e.clientX > threshold) {
        setIsSliderOpen(true);
      }
    };
    
    // Add event listener for mouse movement
    window.addEventListener('mousemove', handleMouseMove);
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  const handleLogin = (authData) => {
    console.log('Login successful, setting auth data');
    const success = authService.setAuth(authData);
    
    if (success) {
      setIsAuthenticated(true);
      setUser(authData.user);
      
      setAlert({
        open: true,
        message: 'Login successful. Loading data...',
        severity: 'success'
      });
    } else {
      setAlert({
        open: true,
        message: 'Authentication error. Please try again.',
        severity: 'error'
      });
    }
  };
  
  const handleLogout = () => {
    console.log('Logging out');
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    
    setAlert({
      open: true,
      message: 'You have been logged out.',
      severity: 'info'
    });
  };
  
  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };
  
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={farmTheme}>
        <CssBaseline />
        <Login onLogin={handleLogin} />
        <Snackbar 
          open={alert.open} 
          autoHideDuration={6000} 
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    );
  }
  
  return (
    <ThemeProvider theme={farmTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'background.default' }}>
        {/* AppBar with Logout Button */}
        <AppBar position="static" color="primary">
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccountBalanceIcon sx={{ mr: 2 }} />
              <Typography variant="h6" component="div">
                Loan Officer Dashboard {user && `- ${user.firstName} ${user.lastName}`}
              </Typography>
            </Box>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ 
                '&:hover': { 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)' 
                },
              }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ flex: 1 }}>
          <Dashboard />
        </Box>
        
        {/* Chat FAB Button (shown when drawer is closed) */}
        {!isSliderOpen && (
          <Fab 
            color="primary" 
            aria-label="chat"
            onClick={() => setIsSliderOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              boxShadow: 3
            }}
          >
            <ChatIcon />
          </Fab>
        )}
        
        {/* Chatbot Drawer */}
        <Drawer
          anchor="right"
          open={isSliderOpen}
          onClose={() => setIsSliderOpen(false)}
          PaperProps={{
            sx: {
              width: 600,
              backgroundColor: 'background.paper',
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            position: 'relative' 
          }}>
            <IconButton 
              onClick={() => setIsSliderOpen(false)}
              sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                zIndex: 2
              }}
              color="primary"
            >
              <CloseIcon />
            </IconButton>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <SystemStatus compact={true} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Chatbot onClose={() => setIsSliderOpen(false)} />
            </Box>
          </Box>
        </Drawer>
        
        <Snackbar 
          open={alert.open} 
          autoHideDuration={6000} 
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App; 