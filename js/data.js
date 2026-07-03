/* ============================================================ */
/*  js/data.js  -  Loader data terpisah per level              */
/* ============================================================ */

const LEVEL_CONFIG = {
  'N5': 'data/n5.json',
  'N4': 'data/n4.json',
  'N3': 'data/n3.json',
  'N2': 'data/n2.json',
  'N1': 'data/n1.json',
  'Tambahan': 'data/tambahan.json'
};

let loadedCache = {};
let masterVocabData = [];

async function loadLevelData(level) {
  if (loadedCache[level]) {
    return loadedCache[level];
  }

  try {
    const url = LEVEL_CONFIG[level];
    if (!url) throw new Error(`Level "${level}" tidak dikenali`);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Gagal memuat ${level} (HTTP ${response.status})`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error(`Data ${level} bukan array`);

    loadedCache[level] = data;
    rebuildMasterData();
    return data;
  } catch (error) {
    console.error(`Error loading ${level}:`, error);
    throw error;
  }
}

async function loadAllData() {
  const levels = Object.keys(LEVEL_CONFIG);
  await Promise.all(levels.map(level => loadLevelData(level)));
}

function rebuildMasterData() {
  masterVocabData = [];
  for (const level in loadedCache) {
    if (Array.isArray(loadedCache[level])) {
      masterVocabData = masterVocabData.concat(loadedCache[level]);
    }
  }
}

function getVocabData() { return masterVocabData; }
function getUniqueLevels() { return [...new Set(masterVocabData.map(v => v.level))]; }
function getUniqueTypes() { return [...new Set(masterVocabData.map(v => v.type))]; }
function getUniqueThemes() { return [...new Set(masterVocabData.map(v => v.theme))]; }
function getTotalVocab() { return masterVocabData.length; }
function isLevelLoaded(level) { return !!loadedCache[level]; }

window.loadLevelData = loadLevelData;
window.loadAllData = loadAllData;
window.getVocabData = getVocabData;
window.getUniqueLevels = getUniqueLevels;
window.getUniqueTypes = getUniqueTypes;
window.getUniqueThemes = getUniqueThemes;
window.getTotalVocab = getTotalVocab;
window.isLevelLoaded = isLevelLoaded;
