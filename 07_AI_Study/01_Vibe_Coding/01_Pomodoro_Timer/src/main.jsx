import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { TimerProvider } from './context/TimerContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <TimerProvider>
        <App />
      </TimerProvider>
    </HashRouter>
  </React.StrictMode>,
);
