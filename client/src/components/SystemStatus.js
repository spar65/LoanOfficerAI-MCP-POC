import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  IconButton,
  Collapse,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import mcpClient from '../mcp/client';

const SystemStatus = ({ compact = false }) => {
  const [status, setStatus] = useState(null);
  const [mcpFunctions, setMcpFunctions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Get system status
      const [systemStatus, functionsStatus] = await Promise.all([
        fetch(`${mcpClient.baseURL}/system/status`).then(r => r.json()),
        fetch(`${mcpClient.baseURL}/mcp/functions`).then(r => r.json())
      ]);
      
      setStatus(systemStatus);
      setMcpFunctions(functionsStatus);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      setStatus({ 
        status: 'error', 
        error: 'Failed to connect to server',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Refresh every 30 seconds if expanded
    let interval;
    if (expanded) {
      interval = setInterval(fetchStatus, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [expanded]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'success';
      case 'degraded': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return <CheckCircleIcon color="success" />;
      case 'degraded': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <ErrorIcon color="disabled" />;
    }
  };

  if (loading && !status) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">Checking system status...</Typography>
            <LinearProgress sx={{ flexGrow: 1, ml: 1 }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (compact && status) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getStatusIcon(status.status)}
        <Typography variant="body2" color="text.secondary">
          System: {status.status}
        </Typography>
        <IconButton size="small" onClick={fetchStatus} disabled={loading}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {status && getStatusIcon(status.status)}
            <Typography variant="h6">
              System Status: {status?.status || 'Unknown'}
            </Typography>
            {status?.version && (
              <Chip label={`v${status.version}`} size="small" variant="outlined" />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={fetchStatus} disabled={loading} size="small">
              <RefreshIcon />
            </IconButton>
            <IconButton 
              onClick={() => setExpanded(!expanded)} 
              size="small"
              aria-label="expand"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {status && status.warnings && status.warnings.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {status.warnings.map((warning, index) => (
              <Chip 
                key={index}
                icon={<WarningIcon />}
                label={warning}
                color="warning"
                variant="outlined"
                size="small"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}

        <Collapse in={expanded}>
          <Grid container spacing={2}>
            {/* System Health */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>System Health</Typography>
              <Box sx={{ pl: 1 }}>
                {status && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Uptime: {Math.floor((status.uptime || 0) / 60)} minutes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Memory: {status.memory?.used} / {status.memory?.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Environment: {status.environment}
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>

            {/* Data Health */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Data Health</Typography>
              <Box sx={{ pl: 1 }}>
                {status?.data_health && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {status.data_health.borrowers_file === 'ok' ? 
                        <CheckCircleIcon color="success" fontSize="small" /> : 
                        <ErrorIcon color="error" fontSize="small" />
                      }
                      <Typography variant="body2">
                        Borrowers: {status.data_health.total_borrowers} records
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {status.data_health.borrower_b001 === 'verified' ? 
                        <CheckCircleIcon color="success" fontSize="small" /> : 
                        <WarningIcon color="warning" fontSize="small" />
                      }
                      <Typography variant="body2">
                        Test Data: B001 {status.data_health.borrower_b001}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Grid>

            {/* MCP Functions */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>MCP Functions</Typography>
              {mcpFunctions && (
                <Box sx={{ pl: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {mcpFunctions.active_functions}/{mcpFunctions.total_functions} functions active
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(mcpFunctions.categories).map(([category, count]) => (
                      <Chip 
                        key={category}
                        label={`${category}: ${count}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>

          {lastUpdate && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Typography>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SystemStatus; 