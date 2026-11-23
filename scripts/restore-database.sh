#!/bin/sh
# Restauration d'une sauvegarde créée par backup-database.sh.
#
# Utilisation, depuis la racine du projet (la base Docker doit être démarrée) :
#
#   ./scripts/restore-database.sh backups/bazardim-2026-11-23_21-30-00.dump bazardim_essai
#     → restaure dans une base d'ESSAI (créée si besoin), sans toucher à la vraie base.
#       C'est ainsi qu'on vérifie régulièrement qu'une sauvegarde est vraiment utilisable.
#
#   ./scripts/restore-database.sh backups/bazardim-2026-11-23_21-30-00.dump
#     → ⚠️ REMPLACE la base bazardim par la sauvegarde (après confirmation).
#
# À la fin, le script affiche le nombre d'utilisateurs, d'annonces et de commandes restaurés.

set -eu

# ${1:?message} : arrête le script avec ce message si le premier argument est absent.
BACKUP_FILE=${1:?Indiquez le fichier de sauvegarde à restaurer, ex : backups/bazardim-....dump}
# Base cible : le deuxième argument, ou "bazardim" s'il est absent.
DATABASE=${2:-bazardim}
CONTAINER=bazardim_database

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Fichier introuvable : $BACKUP_FILE"
  exit 1
fi

# Remplacer la vraie base efface les données actuelles : on demande une confirmation.
if [ "$DATABASE" = "bazardim" ]; then
  printf "⚠️  La base bazardim va être REMPLACÉE par %s.\nÉcrivez RESTAURER pour confirmer : " "$BACKUP_FILE"
  read -r confirmation
  if [ "$confirmation" != "RESTAURER" ]; then
    echo "Restauration annulée."
    exit 1
  fi
fi

# Crée la base cible si elle n'existe pas encore (cas d'une base d'essai).
docker exec "$CONTAINER" createdb --username=bazardim "$DATABASE" 2>/dev/null || true

# pg_restore lit la sauvegarde envoyée par l'entrée standard (-i et <).
# --clean --if-exists : supprime d'abord les tables existantes, pour repartir exactement de la sauvegarde.
# --no-owner : les objets appartiennent à l'utilisateur qui restaure.
docker exec -i "$CONTAINER" pg_restore --username=bazardim --dbname="$DATABASE" --clean --if-exists --no-owner < "$BACKUP_FILE"

echo "✅ Sauvegarde restaurée dans la base $DATABASE :"
docker exec "$CONTAINER" psql --username=bazardim --dbname="$DATABASE" --command="
  SELECT
    (SELECT count(*) FROM users)    AS utilisateurs,
    (SELECT count(*) FROM products) AS annonces,
    (SELECT count(*) FROM orders)   AS commandes;"
