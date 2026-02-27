import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Si vous avez un fichier CSS global

// Retirer StrictMode pour éviter les double renders en dev qui causent des problèmes avec Leaflet
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);