import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Drawer, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import Fab from '@mui/material/Fab';
import Dashboard from './components/Dashboard';
import Chatbot from './components/Chatbot';
import farmTheme from './theme';
import './App.css';

function App() {
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  
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
  
  return (
    <ThemeProvider theme={farmTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Dashboard />
        
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
            <Chatbot onClose={() => setIsSliderOpen(false)} />
          </Box>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
}

export default App; 