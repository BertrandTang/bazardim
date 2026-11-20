import { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { MINIMUM_SEARCH_LENGTH, searchAddresses } from '../../services/addressApi.js';

// Délai d'attente après la dernière frappe avant d'interroger l'API (en millisecondes).
// Sans ce délai, on enverrait une requête à chaque lettre tapée.
const TYPING_DELAY = 300;

/**
 * Champ d'adresse avec suggestions fournies par l'API de la Géoplateforme.
 * Le composant Autocomplete de Material UI gère l'accessibilité (navigation au clavier,
 * annonces pour les lecteurs d'écran).
 *
 * @param {object} props
 * @param {object|null} props.value - Adresse choisie ({ id, label, postcode, city }) ou null.
 * @param {Function} props.onChange - Appelée avec la nouvelle adresse (ou null si on l'efface).
 */
export default function AddressAutocomplete({ value, onChange }) {
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const searchText = inputText.trim();
  const isSearchLongEnough = searchText.length >= MINIMUM_SEARCH_LENGTH;

  // À chaque changement du texte : on attend que l'utilisateur arrête de taper, puis on appelle l'API.
  useEffect(() => {
    // Inutile de chercher si le texte est trop court, ou si c'est l'adresse déjà choisie.
    if (!isSearchLongEnough || searchText === value?.label) {
      return;
    }

    // AbortController permet d'annuler la requête si le texte change entre-temps :
    // on évite ainsi d'afficher les résultats d'une ancienne recherche.
    const abortController = new AbortController();

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        setSuggestions(await searchAddresses(searchText, abortController.signal));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSuggestions([]);
          setErrorMessage('Service d’adresses indisponible : saisissez votre adresse complète.');
        }
      } finally {
        setIsLoading(false);
      }
    }, TYPING_DELAY);

    // Nettoyage : appelé par React avant le prochain effet (nouvelle frappe) ou à la fermeture de la page.
    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [searchText, isSearchLongEnough, value?.label]);

  return (
    <Autocomplete
      // Les suggestions viennent de l'API, déjà filtrées : on ne les refiltre pas.
      options={isSearchLongEnough ? suggestions : []}
      filterOptions={(options) => options}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      value={value}
      onChange={(event, newValue) => onChange(newValue)}
      inputValue={inputText}
      onInputChange={(event, newInputText) => setInputText(newInputText)}
      loading={isLoading}
      loadingText="Recherche…"
      noOptionsText={
        isSearchLongEnough ? 'Aucune adresse trouvée' : `Tapez au moins ${MINIMUM_SEARCH_LENGTH} caractères`
      }
      renderInput={(inputProps) => (
        <TextField
          {...inputProps}
          label="Adresse de livraison"
          error={Boolean(errorMessage)}
          helperText={errorMessage || 'Ex : 10 rue de Rivoli, Paris'}
        />
      )}
    />
  );
}
