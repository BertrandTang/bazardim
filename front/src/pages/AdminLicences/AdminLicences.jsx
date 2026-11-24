import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import PageMetadata from '../../components/PageMetadata/PageMetadata.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProducts } from '../../context/ProductsContext.jsx';
import {
  addLicenceAlias,
  deleteLicenceAlias,
  fetchAdminLicences,
  mergeLicence,
  updateLicence,
} from '../../services/api.js';
import './AdminLicences.css';

/**
 * Page « Modération des licences », réservée aux administrateurs.
 *
 * Quand un vendeur saisit une licence inconnue, elle est créée « en attente » (absente du menu).
 * L'administrateur peut alors :
 * - la VALIDER (c'est une vraie nouvelle licence) ;
 * - la RENOMMER (bonne licence, mal écrite) ;
 * - la FUSIONNER avec une licence existante (doublon, traduction) : ses annonces y sont déplacées
 *   et son nom devient un synonyme, reconnu automatiquement la prochaine fois.
 * Il gère aussi les synonymes des licences validées ("DBZ" → "Dragon Ball Z").
 */
export default function AdminLicences() {
  const { currentUser } = useAuth();
  const { reloadProducts } = useProducts();
  // null = chargement en cours ; ensuite, la liste renvoyée par l'API.
  const [licences, setLicences] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const loadLicences = useCallback(() => {
    return fetchAdminLicences()
      .then((loadedLicences) => setLicences(loadedLicences))
      .catch((error) => setErrorMessage(error.message));
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadLicences();
    }
  }, [isAdmin, loadLicences]);

  /**
   * Lance une action d'administration, affiche son résultat, puis recharge les licences
   * et les annonces (les noms affichés sur les annonces et le menu Licences peuvent avoir changé).
   */
  async function runAction(action, message) {
    try {
      await action();
      setErrorMessage('');
      setSuccessMessage(message);
      await Promise.all([loadLicences(), reloadProducts()]);
    } catch (error) {
      setSuccessMessage('');
      setErrorMessage(error.message);
    }
  }

  if (!isAdmin) {
    return (
      <section className="admin-page">
        <PageMetadata title="Administration" noIndex />
        <h1>Administration</h1>
        <Alert severity="error">Réservé aux administrateurs.</Alert>
      </section>
    );
  }

  const pendingLicences = licences?.filter((licence) => licence.status === 'pending') ?? [];
  const approvedLicences = licences?.filter((licence) => licence.status === 'approved') ?? [];

  return (
    <section className="admin-page">
      <PageMetadata title="Modération des licences" noIndex />
      <h1>Modération des licences</h1>
      <p className="admin-intro">
        Les licences saisies par les vendeurs sont comparées aux licences existantes (sans tenir compte des majuscules,
        accents et ponctuation) et à leurs synonymes. Une licence inconnue attend ici votre validation avant
        d’apparaître dans le menu.
      </p>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      {licences === null ? (
        <p>Chargement…</p>
      ) : (
        <>
          <h2>En attente de validation ({pendingLicences.length})</h2>
          {pendingLicences.length === 0 ? (
            <p className="admin-empty">Aucune licence en attente.</p>
          ) : (
            <div className="admin-list">
              {pendingLicences.map((licence) => (
                <PendingLicence
                  key={licence.id}
                  licence={licence}
                  approvedLicences={approvedLicences}
                  runAction={runAction}
                />
              ))}
            </div>
          )}

          <h2>Licences validées ({approvedLicences.length})</h2>
          <div className="admin-list">
            {approvedLicences.map((licence) => (
              <ApprovedLicence key={licence.id} licence={licence} runAction={runAction} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/** Nombre d'annonces d'une licence, avec un lien vers ces annonces. */
function ProductCount({ licence }) {
  const label = `${licence.product_count} annonce${licence.product_count > 1 ? 's' : ''}`;
  return <Link to={`/licences?licence=${encodeURIComponent(licence.name)}`}>{label}</Link>;
}

/** Carte d'une licence en attente : valider, renommer ou fusionner avec une licence validée. */
function PendingLicence({ licence, approvedLicences, runAction }) {
  const [newName, setNewName] = useState(licence.name);
  const [targetLicenceId, setTargetLicenceId] = useState('');
  const targetLicence = approvedLicences.find((candidate) => candidate.id === targetLicenceId);

  return (
    <article className="admin-licence" aria-label={`Licence en attente : ${licence.name}`}>
      <header className="admin-licence-header">
        <Typography component="h3" variant="h6">
          {licence.name}
        </Typography>
        <ProductCount licence={licence} />
      </header>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
        <Button
          variant="contained"
          onClick={() =>
            runAction(() => updateLicence(licence.id, { status: 'approved' }), `« ${licence.name} » est validée.`)
          }
        >
          Valider
        </Button>
      </Stack>

      {/* Renommer : corriger l'orthographe. L'ancien nom devient un synonyme. */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
        <TextField
          label="Nouveau nom"
          size="small"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
        />
        <Button
          variant="outlined"
          disabled={newName.trim() === '' || newName.trim() === licence.name}
          onClick={() =>
            runAction(
              () => updateLicence(licence.id, { name: newName.trim() }),
              `Licence renommée en « ${newName.trim()} ».`,
            )
          }
        >
          Renommer
        </Button>
      </Stack>

      {/* Fusionner : c'est un doublon (autre écriture, traduction) d'une licence validée. */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
        <TextField
          select
          label="C’est la même licence que…"
          size="small"
          sx={{ minWidth: 240 }}
          value={targetLicenceId}
          onChange={(event) => setTargetLicenceId(event.target.value)}
        >
          {approvedLicences.map((candidate) => (
            <MenuItem key={candidate.id} value={candidate.id}>
              {candidate.name}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          color="secondary"
          disabled={!targetLicence}
          onClick={() =>
            runAction(
              () => mergeLicence(licence.id, targetLicence.id),
              `« ${licence.name} » a été fusionnée dans « ${targetLicence.name} » et devient un synonyme.`,
            )
          }
        >
          Fusionner
        </Button>
      </Stack>
    </article>
  );
}

/** Carte d'une licence validée : ses synonymes (ajout, suppression). */
function ApprovedLicence({ licence, runAction }) {
  const [newAlias, setNewAlias] = useState('');

  async function handleAddAlias(event) {
    event.preventDefault();
    await runAction(() => addLicenceAlias(licence.id, newAlias.trim()), `Synonyme ajouté à « ${licence.name} ».`);
    setNewAlias('');
  }

  return (
    <article className="admin-licence" aria-label={`Licence validée : ${licence.name}`}>
      <header className="admin-licence-header">
        <Typography component="h3" variant="h6">
          {licence.name}
        </Typography>
        <ProductCount licence={licence} />
      </header>

      <div className="admin-aliases">
        <span>Synonymes :</span>
        {licence.aliases.length === 0 && <span className="admin-empty">aucun</span>}
        {licence.aliases.map((alias) => (
          <Chip
            key={alias}
            label={alias}
            size="small"
            onDelete={() => runAction(() => deleteLicenceAlias(licence.id, alias), `Synonyme « ${alias} » supprimé.`)}
          />
        ))}
      </div>

      <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap onSubmit={handleAddAlias}>
        <TextField
          label="Ajouter un synonyme"
          size="small"
          placeholder="Traduction, abréviation…"
          value={newAlias}
          onChange={(event) => setNewAlias(event.target.value)}
        />
        <Button type="submit" variant="outlined" disabled={newAlias.trim() === ''}>
          Ajouter
        </Button>
      </Stack>
    </article>
  );
}
