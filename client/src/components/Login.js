import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  Grid,
  CircularProgress
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call the server's authentication endpoint
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        username,
        password
      }, {
        withCredentials: true // Important for cookies
      });

      if (response.data.success) {
        console.log('Authentication successful:', response.data);
        onLogin({
          token: response.data.accessToken,
          user: response.data.user
        });
      } else {
        setError('Authentication failed: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response && err.response.status === 401) {
        setError('Invalid credentials. Please check username and password.');
      } else {
        setError('Server error: ' + (err.response?.data?.message || err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3}
        sx={{
          marginTop: 8,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3
          }}
        >
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 2,
              borderRadius: '50%',
              mb: 2
            }}
          >
            <AccountBalanceIcon fontSize="large" />
          </Box>
          <Typography component="h1" variant="h5">
            Loan Officer Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Agricultural Lending Intelligence
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} /> : "Sign In"}
          </Button>
          <Grid container justifyContent="center">
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                Use: john.doe / password123
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 