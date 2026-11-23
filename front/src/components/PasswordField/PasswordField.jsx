import { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
// On importe chaque icône par son propre chemin : seules ces deux icônes sont ajoutées au site.
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

/**
 * Champ "mot de passe" avec un bouton en forme d'œil pour afficher ou masquer le texte tapé.
 * Il s'utilise exactement comme un TextField de Material UI (mêmes props : label, name, value...).
 *
 * Utilisation : <PasswordField label="Mot de passe" value={password} onChange={...} />
 */
export default function PasswordField(props) {
  // false = mot de passe masqué (••••), true = mot de passe affiché en clair.
  const [isVisible, setIsVisible] = useState(false);

  // Texte lu par les lecteurs d'écran et affiché au survol de la souris.
  const buttonLabel = isVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe';

  return (
    <TextField
      // {...props} transmet au TextField toutes les props reçues (label, value, onChange...).
      {...props}
      // Le navigateur masque le texte d'un champ "password" ; un champ "text" l'affiche.
      type={isVisible ? 'text' : 'password'}
      slotProps={{
        input: {
          // Élément affiché à la fin du champ : le bouton œil.
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={buttonLabel}
                title={buttonLabel}
                edge="end"
                onClick={() => setIsVisible(!isVisible)}
              >
                {/* Œil barré quand le mot de passe est visible (cliquer le masquera), œil ouvert sinon. */}
                {isVisible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
