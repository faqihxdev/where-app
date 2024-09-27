import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react';
import { Provider } from 'jotai';
import App from './App.tsx'
import './index.css'
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: 'Poppins',
    body: 'Poppins',
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </Provider>
  </StrictMode>,
)
