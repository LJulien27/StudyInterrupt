// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import { initOAuth } from './oauth';
import { AuthProvider } from "./AuthContext";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
initOAuth();
root.render(
  <React.StrictMode>
    <AuthProvider>
    <App />
    </AuthProvider>
  </React.StrictMode>
);

