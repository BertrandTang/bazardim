// Point d'entrée de l'application : React affiche le composant <App /> dans la balise
// <div id="root"> du fichier index.html.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import './index.css';
import App from './App.jsx';
import theme from './theme.js';

createRoot(document.getElementById('root')).render(
  // StrictMode active des vérifications supplémentaires en développement (aucun effet en production).
  <StrictMode>
    {/* ThemeProvider donne aux composants Material UI les couleurs de la charte (voir theme.js). */}
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
