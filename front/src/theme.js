import { createTheme } from '@mui/material/styles';

/**
 * Thème Material UI aux couleurs de la charte Bazardim (voir les variables de src/index.css).
 *
 * Sans thème, MUI utilise son bleu par défaut (#1976d2) pour les boutons, onglets et liens :
 * il ne s'accorde pas avec le violet et le rose du site, et son contraste n'est que de 4,6:1 sur blanc,
 * 4:1 sur le fond pastel et 3,5:1 sur le bleu clair des cartes (sous le minimum WCAG de 4,5:1).
 *
 * Les couleurs choisies gardent au moins 4,5:1 sur tous les fonds du site
 * (blanc, fond pastel des pages, bleu clair des cartes) :
 * - violet #5b2be0 : 5,6:1 à 7,3:1 ;
 * - rouge  #b71c1c : 5,1:1 à 6,6:1.
 */
const theme = createTheme({
  palette: {
    primary: { main: '#5b2be0' },
    error: { main: '#b71c1c' },
  },
});

export default theme;
