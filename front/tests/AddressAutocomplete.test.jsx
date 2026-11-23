import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as addressApi from '../src/services/addressApi.js';
import AddressAutocomplete from '../src/components/AddressAutocomplete/AddressAutocomplete.jsx';

/** Petit composant parent qui garde l'adresse choisie, comme la page Panier. */
function AddressField() {
  const [address, setAddress] = useState(null);
  return (
    <>
      <AddressAutocomplete value={address} onChange={setAddress} />
      <output data-testid="chosen-address">{address?.label ?? 'aucune'}</output>
    </>
  );
}

describe('AddressAutocomplete', () => {
  it('propose les adresses renvoyées par l’API et enregistre celle choisie', async () => {
    const searchSpy = vi
      .spyOn(addressApi, 'searchAddresses')
      .mockResolvedValue([{ id: 'A1', label: '10 Rue de Rivoli 75004 Paris', postcode: '75004', city: 'Paris' }]);
    const user = userEvent.setup();
    render(<AddressField />);

    await user.type(screen.getByLabelText('Adresse de livraison'), '10 rue de rivoli');
    // findBy... attend que l'élément apparaisse (délai de frappe + réponse de l'API).
    await user.click(await screen.findByRole('option', { name: '10 Rue de Rivoli 75004 Paris' }));

    expect(screen.getByTestId('chosen-address')).toHaveTextContent('10 Rue de Rivoli 75004 Paris');
    // Une seule requête malgré 16 lettres tapées, grâce au délai d'attente.
    expect(searchSpy).toHaveBeenCalledTimes(1);
  });

  it('affiche un message si le service d’adresses est indisponible', async () => {
    vi.spyOn(addressApi, 'searchAddresses').mockRejectedValue(new Error('503'));
    const user = userEvent.setup();
    render(<AddressField />);

    await user.type(screen.getByLabelText('Adresse de livraison'), '10 rue');
    expect(await screen.findByText(/Service d’adresses indisponible/)).toBeInTheDocument();
  });

  it('n’interroge pas l’API pour moins de 3 caractères', async () => {
    const searchSpy = vi.spyOn(addressApi, 'searchAddresses');
    const user = userEvent.setup();
    render(<AddressField />);

    await user.type(screen.getByLabelText('Adresse de livraison'), '10');
    expect(await screen.findByText('Tapez au moins 3 caractères')).toBeInTheDocument();
    expect(searchSpy).not.toHaveBeenCalled();
  });
});
