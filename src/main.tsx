import { createRoot } from 'react-dom/client';
import { Provider } from 'jotai';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import App from './App.tsx';
import './index.css';

const theme = extendTheme({
  fonts: {
    heading: 'Poppins',
    body: 'Poppins',
  },
  colors: {
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <Provider>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </Provider>
);
