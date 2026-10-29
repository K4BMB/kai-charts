import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'kai-charts-react/styles.css';
import './styles.css';
import { App } from './app';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
