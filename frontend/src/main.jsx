// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import theme from './theme';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <AuthProvider> {/* <-- Wrap App */}
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </AuthProvider>
  </React.StrictMode>
);