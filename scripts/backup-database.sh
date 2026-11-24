#!/bin/sh
# Sauvegarde de la base PostgreSQL de Bazardim avec pg_dump.
#
# Utilisation, depuis la racine du projet (la base Docker doit être démarrée) :
#   ./scripts/backup-database.sh
# Résultat : un fichier backups/bazardim-AAAA-MM-JJ_HH-MM-SS.dump
#
# - pg_dump est lancé DANS le conteneur de la base : rien à installer sur le poste.
# - Format « custom » : fichier compressé, que pg_restore sait relire (voir restore-database.sh).
# - Seules les 7 sauvegardes les plus récentes sont gardées : les plus anciennes sont supprimées.
#
# En production, ce script est lancé automatiquement chaque nuit par une tâche planifiée (cron), ex :
#   0 3 * * * cd /chemin/vers/bazardim && ./scripts/backup-database.sh
# et les fichiers sont copiés sur un autre serveur : une sauvegarde gardée sur la même machine
# disparaîtrait avec elle en cas de panne.

# Arrête le script à la première erreur (-e) ou si une variable n'est pas définie (-u).
set -eu

CONTAINER=bazardim_database
BACKUP_DIRECTORY=backups
KEPT_BACKUP_COUNT=7

mkdir -p "$BACKUP_DIRECTORY"
BACKUP_FILE="$BACKUP_DIRECTORY/bazardim-$(date +%Y-%m-%d_%H-%M-%S).dump"

# On écrit d'abord dans un fichier temporaire : si pg_dump échoue, on ne garde pas
# une sauvegarde incomplète qui ferait croire que tout s'est bien passé.
if ! docker exec "$CONTAINER" pg_dump --username=bazardim --format=custom bazardim > "$BACKUP_FILE.tmp"; then
  rm -f "$BACKUP_FILE.tmp"
  echo "❌ Échec de la sauvegarde (la base Docker est-elle démarrée ?)"
  exit 1
fi
mv "$BACKUP_FILE.tmp" "$BACKUP_FILE"
echo "✅ Sauvegarde créée : $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Rotation : liste les sauvegardes de la plus récente à la plus ancienne (ls -t),
# saute les 7 premières (tail) et supprime les suivantes.
ls -1t "$BACKUP_DIRECTORY"/bazardim-*.dump | tail -n +$((KEPT_BACKUP_COUNT + 1)) | while read -r oldBackup; do
  rm -f "$oldBackup"
  echo "Ancienne sauvegarde supprimée : $oldBackup"
done
