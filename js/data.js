/* ============================================================ */
/*  js/data.js  -  Loader data terpisah per level              */
/* ============================================================ */

// Konfigurasi file data berdasarkan level
const LEVEL_CONFIG = {
  'N5': 'data/n5.json',
  'N4': 'data/n4.json',
  'N3': 'data/n3.json',
  'N2': 'data/n2.json',
  'N1': 'data/n1.json',
  'Tambahan': 'data/tambahan.json'
};

// Cache data yang sudah dimuat
let loadedCache = {};
// Gabungan semua data yang sudah dimuat
let masterVocabData = [];

/**
 * Memuat data untuk satu level tertentu
 * @param {string} level - 'N5', 'N4', 'N3', 'N2', 'N1', 'Tambahan'
 * @returns {Promise<Array>}
 */
async function loadLevelData(level) {
  // Jika sudah dimuat, kembalikan data dari cache
  if (loadedCache[level]) {
    return loadedCache[level];
  }

  try {
    const url = LEVEL_CONFIG[level];
    if (!url) {
      throw new Error(`Level "${level}" tidak dikenali`);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Gagal memuat ${level} (HTTP ${response.status})`);
    }

    const data = await response.json();

    // Validasi dasar
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`Data untuk ${level} kosong atau format tidak sesuai`);
    }

    // Simpan ke cache
    loadedCache[level] = data;
    
    // Rebuild master data (gabungkan semua level yang sudah dimuat)
    rebuildMasterData();

    return data;
  } catch (error) {
    console.error(`Error loading ${level}:`, error);
    throw error;
  }
}

/**
 * Memuat SEMUA level sekaligus
 * @returns {Promise<void>}
 */
async function loadAllData() {
  const levels = Object.keys(LEVEL_CONFIG);
  await Promise.all(levels.map(level => loadLevelData(level)));
}

/**
 * Menggabungkan semua data dari cache ke masterVocabData
 */
function rebuildMasterData() {
  masterVocabData = [];
  for (const level in loadedCache) {
    if (Array.isArray(loadedCache[level])) {
      masterVocabData = masterVocabData.concat(loadedCache[level]);
    }
  }
}

/**
 * Mendapatkan seluruh data yang sudah dimuat (sinkron)
 * @returns {Array}
 */
function getVocabData() {
  return masterVocabData;
}

/**
 * Mendapatkan daftar level unik dari data yang sudah dimuat
 * @returns {string[]}
 */
function getUniqueLevels() {
  const levels = masterVocabData.map(v => v.level);
  return [...new Set(levels)];
}

/**
 * Mendapatkan daftar tipe unik dari data yang sudah dimuat
 * @returns {string[]}
 */
function getUniqueTypes() {
  const types = masterVocabData.map(v => v.type);
  return [...new Set(types)];
}

/**
 * Mendapatkan daftar tema unik dari data yang sudah dimuat
 * @returns {string[]}
 */
function getUniqueThemes() {
  const themes = masterVocabData.map(v => v.theme);
  return [...new Set(themes)];
}

/**
 * Total kosakata yang sudah dimuat
 * @returns {number}
 */
function getTotalVocab() {
  return masterVocabData.length;
}

/**
 * Mengecek apakah suatu level sudah dimuat
 * @param {string} level
 * @returns {boolean}
 */
function isLevelLoaded(level) {
  return !!loadedCache[level];
}

// Ekspos ke global
window.loadLevelData = loadLevelData;
window.loadAllData = loadAllData;
window.getVocabData = getVocabData;
window.getUniqueLevels = getUniqueLevels;
window.getUniqueTypes = getUniqueTypes;
window.getUniqueThemes = getUniqueThemes;
window.getTotalVocab = getTotalVocab;
window.isLevelLoaded = isLevelLoaded;
