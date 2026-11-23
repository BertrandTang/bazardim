// Met à jour les barres de progression de todo.md à partir des cases cochées "- [x]".
//
// Seules les tâches À CODER ou À VÉRIFIER comptent dans la progression. Tout ce qui se trouve
// après le marqueur <!-- hors-progression --> (rédaction du dossier, entraînement au bloc 4...)
// est compté à part, sur une ligne séparée.
//
// Utilisation, depuis la racine du projet, après avoir coché des cases :
//   node scripts/update-todo-progress.mjs
//
// Le script remplace uniquement ce qui se trouve entre les deux marqueurs ci-dessous.
import { readFileSync, writeFileSync } from 'node:fs';

const TODO_FILE = new URL('../todo.md', import.meta.url);
const START_MARKER = '<!-- progression:debut -->';
const END_MARKER = '<!-- progression:fin -->';
const EXCLUDED_MARKER = '<!-- hors-progression -->';
const BAR_LENGTH = 20;

/** Construit une barre comme `██████░░░░░░░░░░░░░░` 30 %. */
function buildProgressBar(doneCount, totalCount) {
  const ratio = totalCount === 0 ? 0 : doneCount / totalCount;
  const filledLength = Math.round(ratio * BAR_LENGTH);
  const bar = '█'.repeat(filledLength) + '░'.repeat(BAR_LENGTH - filledLength);
  return `\`${bar}\` ${Math.round(ratio * 100)} %`;
}

/**
 * Découpe le fichier en sections "## Titre" et compte, pour chacune,
 * les cases cochées "- [x]" et le total des cases "- [ ]" / "- [x]".
 * Les sections sans aucune case (état des lieux, nettoyage déjà fait) sont ignorées.
 * Chaque section indique si elle se trouve après le marqueur EXCLUDED_MARKER (isExcluded).
 */
function countTasksBySection(markdown) {
  const sections = [];
  let currentSection = null;
  let isAfterExcludedMarker = false;

  for (const line of markdown.split('\n')) {
    if (line.trim() === EXCLUDED_MARKER) {
      isAfterExcludedMarker = true;
      continue;
    }

    const heading = line.match(/^## (.+)/);
    if (heading) {
      // "Bloc 3 — Back-end (dossier + soutenance)" devient "Bloc 3 — Back-end"
      currentSection = {
        title: heading[1].split(' (')[0],
        doneCount: 0,
        totalCount: 0,
        isExcluded: isAfterExcludedMarker,
      };
      sections.push(currentSection);
      continue;
    }

    const checkbox = line.match(/^\s*- \[( |x|X)\]/);
    if (checkbox && currentSection) {
      currentSection.totalCount += 1;
      if (checkbox[1] !== ' ') {
        currentSection.doneCount += 1;
      }
    }
  }

  return sections.filter((section) => section.totalCount > 0);
}

/** Additionne les cases cochées et le total des cases de plusieurs sections. */
function sumTasks(sections) {
  return {
    doneCount: sections.reduce((total, section) => total + section.doneCount, 0),
    totalCount: sections.reduce((total, section) => total + section.totalCount, 0),
  };
}

function buildProgressBlock(allSections) {
  const sections = allSections.filter((section) => !section.isExcluded);
  const excludedSections = allSections.filter((section) => section.isExcluded);
  const { doneCount, totalCount } = sumTasks(sections);

  // Une ligne par section hors progression, ex : "Dossier écrit : 0 / 30".
  const excludedLines = excludedSections.map(
    (section) => `- ${section.title} : ${section.doneCount} / ${section.totalCount}`,
  );

  const tableRows = sections.map(
    (section) =>
      `| ${section.title} | ${buildProgressBar(section.doneCount, section.totalCount)} | ${section.doneCount} / ${section.totalCount} |`,
  );

  return [
    START_MARKER,
    `**Progression globale : ${buildProgressBar(doneCount, totalCount)} (${doneCount} / ${totalCount} tâches)**`,
    '',
    '| Partie | Progression | Tâches |',
    '| --- | --- | --- |',
    ...tableRows,
    '',
    '**Hors progression** (suivi à part, voir en bas du fichier) :',
    '',
    ...excludedLines,
    '',
    '_Calcul automatique : chaque case compte pour une tâche, quelle que soit sa taille._',
    '_Après avoir coché des cases : `node scripts/update-todo-progress.mjs`_',
    END_MARKER,
  ].join('\n');
}

const markdown = readFileSync(TODO_FILE, 'utf8');
const startIndex = markdown.indexOf(START_MARKER);
const endIndex = markdown.indexOf(END_MARKER);

if (startIndex === -1 || endIndex === -1) {
  console.error(`Marqueurs introuvables dans todo.md : ajoutez ${START_MARKER} et ${END_MARKER}.`);
  process.exit(1);
}

const sections = countTasksBySection(markdown);
const updatedMarkdown =
  markdown.slice(0, startIndex) + buildProgressBlock(sections) + markdown.slice(endIndex + END_MARKER.length);

writeFileSync(TODO_FILE, updatedMarkdown);
console.log('Progression de todo.md mise à jour.');
