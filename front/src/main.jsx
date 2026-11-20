// Point d'entrée de l'application : React affiche le composant <App /> dans la balise
// <div id="root"> du fichier index.html.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './main.css';
import App from './App/App.jsx';

createRoot(document.getElementById('root')).render(
  // StrictMode active des vérifications supplémentaires en développement (aucun effet en production).
  <StrictMode>
    <App />
  </StrictMode>,
);
