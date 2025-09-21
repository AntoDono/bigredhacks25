// Multilingual element definitions
const ELEMENT_TRANSLATIONS = {
  // Basic starter elements
  'water': {
    'en-US': 'Water',
    'es-ES': 'Agua',
    'fr-FR': 'Eau',
    'de-DE': 'Wasser',
    'it-IT': 'Acqua',
    'pt-BR': 'Água',
    'ja-JP': '水',
    'ko-KR': '물',
    'zh-CN': '水'
  },
  'fire': {
    'en-US': 'Fire',
    'es-ES': 'Fuego',
    'fr-FR': 'Feu',
    'de-DE': 'Feuer',
    'it-IT': 'Fuoco',
    'pt-BR': 'Fogo',
    'ja-JP': '火',
    'ko-KR': '불',
    'zh-CN': '火'
  },
  'earth': {
    'en-US': 'Earth',
    'es-ES': 'Tierra',
    'fr-FR': 'Terre',
    'de-DE': 'Erde',
    'it-IT': 'Terra',
    'pt-BR': 'Terra',
    'ja-JP': '土',
    'ko-KR': '땅',
    'zh-CN': '土'
  },
  'air': {
    'en-US': 'Air',
    'es-ES': 'Aire',
    'fr-FR': 'Air',
    'de-DE': 'Luft',
    'it-IT': 'Aria',
    'pt-BR': 'Ar',
    'ja-JP': '空気',
    'ko-KR': '공기',
    'zh-CN': '空气'
  },
  'wind': {
    'en-US': 'Wind',
    'es-ES': 'Viento',
    'fr-FR': 'Vent',
    'de-DE': 'Wind',
    'it-IT': 'Vento',
    'pt-BR': 'Vento',
    'ja-JP': '風',
    'ko-KR': '바람',
    'zh-CN': '风'
  },
  'axe': {
    'en-US': 'Axe',
    'es-ES': 'Hacha',
    'fr-FR': 'Hache',
    'de-DE': 'Axt',
    'it-IT': 'Ascia',
    'pt-BR': 'Machado',
    'ja-JP': '斧',
    'ko-KR': '도끼',
    'zh-CN': '斧头'
  },
  'pickaxe': {
    'en-US': 'Pickaxe',
    'es-ES': 'Pico',
    'fr-FR': 'Pioche',
    'de-DE': 'Spitzhacke',
    'it-IT': 'Piccone',
    'pt-BR': 'Picareta',
    'ja-JP': 'つるはし',
    'ko-KR': '곡괭이',
    'zh-CN': '镐'
  },
  'stemcell': {
    'en-US': 'Stemcell',
    'es-ES': 'Célula madre',
    'fr-FR': 'Cellule souche',
    'de-DE': 'Stammzelle',
    'it-IT': 'Cellula staminale',
    'pt-BR': 'Célula-tronco',
    'ja-JP': '幹細胞',
    'ko-KR': '줄기세포',
    'zh-CN': '干细胞'
  },
  'tree': {
    'en-US': 'Tree',
    'es-ES': 'Árbol',
    'fr-FR': 'Arbre',
    'de-DE': 'Baum',
    'it-IT': 'Albero',
    'pt-BR': 'Árvore',
    'ja-JP': '木',
    'ko-KR': '나무',
    'zh-CN': '树'
  },
  'stone': {
    'en-US': 'Stone',
    'es-ES': 'Piedra',
    'fr-FR': 'Pierre',
    'de-DE': 'Stein',
    'it-IT': 'Pietra',
    'pt-BR': 'Pedra',
    'ja-JP': '石',
    'ko-KR': '돌',
    'zh-CN': '石头'
  },
  // Generated elements (commonly created ones)
  'steam': {
    'en-US': 'Steam',
    'es-ES': 'Vapor',
    'fr-FR': 'Vapeur',
    'de-DE': 'Dampf',
    'it-IT': 'Vapore',
    'pt-BR': 'Vapor',
    'ja-JP': '蒸気',
    'ko-KR': '증기',
    'zh-CN': '蒸汽'
  },
  'mud': {
    'en-US': 'Mud',
    'es-ES': 'Barro',
    'fr-FR': 'Boue',
    'de-DE': 'Schlamm',
    'it-IT': 'Fango',
    'pt-BR': 'Lama',
    'ja-JP': '泥',
    'ko-KR': '진흙',
    'zh-CN': '泥'
  },
  'lava': {
    'en-US': 'Lava',
    'es-ES': 'Lava',
    'fr-FR': 'Lave',
    'de-DE': 'Lava',
    'it-IT': 'Lava',
    'pt-BR': 'Lava',
    'ja-JP': '溶岩',
    'ko-KR': '용암',
    'zh-CN': '熔岩'
  },
  'cloud': {
    'en-US': 'Cloud',
    'es-ES': 'Nube',
    'fr-FR': 'Nuage',
    'de-DE': 'Wolke',
    'it-IT': 'Nuvola',
    'pt-BR': 'Nuvem',
    'ja-JP': '雲',
    'ko-KR': '구름',
    'zh-CN': '云'
  },
  'house': {
    'en-US': 'House',
    'es-ES': 'Casa',
    'fr-FR': 'Maison',
    'de-DE': 'Haus',
    'it-IT': 'Casa',
    'pt-BR': 'Casa',
    'ja-JP': '家',
    'ko-KR': '집',
    'zh-CN': '房子'
  },
  'sword': {
    'en-US': 'Sword',
    'es-ES': 'Espada',
    'fr-FR': 'Épée',
    'de-DE': 'Schwert',
    'it-IT': 'Spada',
    'pt-BR': 'Espada',
    'ja-JP': '剣',
    'ko-KR': '검',
    'zh-CN': '剑'
  },
  'electricity': {
    'en-US': 'Electricity',
    'es-ES': 'Electricidad',
    'fr-FR': 'Électricité',
    'de-DE': 'Elektrizität',
    'it-IT': 'Elettricità',
    'pt-BR': 'Eletricidade',
    'ja-JP': '電気',
    'ko-KR': '전기',
    'zh-CN': '电'
  },
  'plant': {
    'en-US': 'Plant',
    'es-ES': 'Planta',
    'fr-FR': 'Plante',
    'de-DE': 'Pflanze',
    'it-IT': 'Pianta',
    'pt-BR': 'Planta',
    'ja-JP': '植物',
    'ko-KR': '식물',
    'zh-CN': '植物'
  },
  'metal': {
    'en-US': 'Metal',
    'es-ES': 'Metal',
    'fr-FR': 'Métal',
    'de-DE': 'Metall',
    'it-IT': 'Metallo',
    'pt-BR': 'Metal',
    'ja-JP': '金属',
    'ko-KR': '금속',
    'zh-CN': '金属'
  },
  'glass': {
    'en-US': 'Glass',
    'es-ES': 'Vidrio',
    'fr-FR': 'Verre',
    'de-DE': 'Glas',
    'it-IT': 'Vetro',
    'pt-BR': 'Vidro',
    'ja-JP': 'ガラス',
    'ko-KR': '유리',
    'zh-CN': '玻璃'
  },
  'storm': {
    'en-US': 'Storm',
    'es-ES': 'Tormenta',
    'fr-FR': 'Tempête',
    'de-DE': 'Sturm',
    'it-IT': 'Tempesta',
    'pt-BR': 'Tempestade',
    'ja-JP': '嵐',
    'ko-KR': '폭풍',
    'zh-CN': '风暴'
  },
  'lightning': {
    'en-US': 'Lightning',
    'es-ES': 'Rayo',
    'fr-FR': 'Foudre',
    'de-DE': 'Blitz',
    'it-IT': 'Fulmine',
    'pt-BR': 'Raio',
    'ja-JP': '稲妻',
    'ko-KR': '번개',
    'zh-CN': '闪电'
  },
  'diamond': {
    'en-US': 'Diamond',
    'es-ES': 'Diamante',
    'fr-FR': 'Diamant',
    'de-DE': 'Diamant',
    'it-IT': 'Diamante',
    'pt-BR': 'Diamante',
    'ja-JP': 'ダイヤモンド',
    'ko-KR': '다이아몬드',
    'zh-CN': '钻石'
  },
  'machine': {
    'en-US': 'Machine',
    'es-ES': 'Máquina',
    'fr-FR': 'Machine',
    'de-DE': 'Maschine',
    'it-IT': 'Macchina',
    'pt-BR': 'Máquina',
    'ja-JP': '機械',
    'ko-KR': '기계',
    'zh-CN': '机器'
  },
  'volcano': {
    'en-US': 'Volcano',
    'es-ES': 'Volcán',
    'fr-FR': 'Volcan',
    'de-DE': 'Vulkan',
    'it-IT': 'Vulcano',
    'pt-BR': 'Vulcão',
    'ja-JP': '火山',
    'ko-KR': '화산',
    'zh-CN': '火山'
  },
  'castle': {
    'en-US': 'Castle',
    'es-ES': 'Castillo',
    'fr-FR': 'Château',
    'de-DE': 'Schloss',
    'it-IT': 'Castello',
    'pt-BR': 'Castelo',
    'ja-JP': '城',
    'ko-KR': '성',
    'zh-CN': '城堡'
  },
  'sand': {
    'en-US': 'Sand',
    'es-ES': 'Arena',
    'fr-FR': 'Sable',
    'de-DE': 'Sand',
    'it-IT': 'Sabbia',
    'pt-BR': 'Areia',
    'ja-JP': '砂',
    'ko-KR': '모래',
    'zh-CN': '沙'
  },
  'dust': {
    'en-US': 'Dust',
    'es-ES': 'Polvo',
    'fr-FR': 'Poussière',
    'de-DE': 'Staub',
    'it-IT': 'Polvere',
    'pt-BR': 'Pó',
    'ja-JP': 'ほこり',
    'ko-KR': '먼지',
    'zh-CN': '灰尘'
  },
  'pressure': {
    'en-US': 'Pressure',
    'es-ES': 'Presión',
    'fr-FR': 'Pression',
    'de-DE': 'Druck',
    'it-IT': 'Pressione',
    'pt-BR': 'Pressão',
    'ja-JP': '圧力',
    'ko-KR': '압력',
    'zh-CN': '压力'
  },
  'brick': {
    'en-US': 'Brick',
    'es-ES': 'Ladrillo',
    'fr-FR': 'Brique',
    'de-DE': 'Ziegel',
    'it-IT': 'Mattone',
    'pt-BR': 'Tijolo',
    'ja-JP': 'レンガ',
    'ko-KR': '벽돌',
    'zh-CN': '砖'
  },
  'wood': {
    'en-US': 'Wood',
    'es-ES': 'Madera',
    'fr-FR': 'Bois',
    'de-DE': 'Holz',
    'it-IT': 'Legno',
    'pt-BR': 'Madeira',
    'ja-JP': '木材',
    'ko-KR': '나무',
    'zh-CN': '木头'
  },
  'pebbles': {
    'en-US': 'Pebbles',
    'es-ES': 'Guijarros',
    'fr-FR': 'Cailloux',
    'de-DE': 'Kieselsteine',
    'it-IT': 'Ciottoli',
    'pt-BR': 'Seixos',
    'ja-JP': '小石',
    'ko-KR': '자갈',
    'zh-CN': '鹅卵石'
  },
  'ash': {
    'en-US': 'Ash',
    'es-ES': 'Ceniza',
    'fr-FR': 'Cendre',
    'de-DE': 'Asche',
    'it-IT': 'Cenere',
    'pt-BR': 'Cinza',
    'ja-JP': '灰',
    'ko-KR': '재',
    'zh-CN': '灰'
  },
  'desert': {
    'en-US': 'Desert',
    'es-ES': 'Desierto',
    'fr-FR': 'Désert',
    'de-DE': 'Wüste',
    'it-IT': 'Deserto',
    'pt-BR': 'Deserto',
    'ja-JP': '砂漠',
    'ko-KR': '사막',
    'zh-CN': '沙漠'
  },
  'obsidian': {
    'en-US': 'Obsidian',
    'es-ES': 'Obsidiana',
    'fr-FR': 'Obsidienne',
    'de-DE': 'Obsidian',
    'it-IT': 'Ossidiana',
    'pt-BR': 'Obsidiana',
    'ja-JP': '黒曜石',
    'ko-KR': '흑요석',
    'zh-CN': '黑曜石'
  },
  'ocean': {
    'en-US': 'Ocean',
    'es-ES': 'Océano',
    'fr-FR': 'Océan',
    'de-DE': 'Ozean',
    'it-IT': 'Oceano',
    'pt-BR': 'Oceano',
    'ja-JP': '海',
    'ko-KR': '바다',
    'zh-CN': '海洋'
  },
  'forest': {
    'en-US': 'Forest',
    'es-ES': 'Bosque',
    'fr-FR': 'Forêt',
    'de-DE': 'Wald',
    'it-IT': 'Foresta',
    'pt-BR': 'Floresta',
    'ja-JP': '森',
    'ko-KR': '숲',
    'zh-CN': '森林'
  },
  'mountain': {
    'en-US': 'Mountain',
    'es-ES': 'Montaña',
    'fr-FR': 'Montagne',
    'de-DE': 'Berg',
    'it-IT': 'Montagna',
    'pt-BR': 'Montanha',
    'ja-JP': '山',
    'ko-KR': '산',
    'zh-CN': '山'
  },
  'tool': {
    'en-US': 'Tool',
    'es-ES': 'Herramienta',
    'fr-FR': 'Outil',
    'de-DE': 'Werkzeug',
    'it-IT': 'Strumento',
    'pt-BR': 'Ferramenta',
    'ja-JP': '道具',
    'ko-KR': '도구',
    'zh-CN': '工具'
  }
};

// Initial elements configuration with emojis
const INITIAL_ELEMENTS_CONFIG = [
  { id: "water", emoji: "💧" },
  { id: "fire", emoji: "🔥" },
  { id: "wind", emoji: "💨" },
  { id: "earth", emoji: "🌍" }
];

/**
 * Get translated element name
 * @param {string} elementKey - Element key (e.g., 'water', 'fire')
 * @param {string} languageCode - Language code (e.g., 'en-US', 'es-ES')
 * @returns {string} - Translated element name
 */
function getElementName(elementKey, languageCode = 'en-US') {
  const translations = ELEMENT_TRANSLATIONS[elementKey.toLowerCase()];
  if (!translations) {
    // If no translation found, return the original key capitalized
    return elementKey.charAt(0).toUpperCase() + elementKey.slice(1);
  }
  
  return translations[languageCode] || translations['en-US'] || elementKey;
}

/**
 * Get initial elements for a specific language
 * @param {string} languageCode - Language code (e.g., 'en-US', 'es-ES')
 * @returns {Array} - Array of initial elements with translated names and English text
 */
function getInitialElements(languageCode = 'en-US') {
  return INITIAL_ELEMENTS_CONFIG.map(element => {
    const translatedName = getElementName(element.id, languageCode);
    const englishName = getElementName(element.id, 'en-US');
    
    // Create display text with format "translated (English)" if different languages
    const displayText = languageCode !== 'en-US' && translatedName !== englishName 
      ? `${translatedName} (${englishName})`
      : translatedName;
    
    return {
      id: element.id,
      text: displayText,
      en_text: englishName,
      emoji: element.emoji
    };
  });
}

/**
 * Get available language codes
 * @returns {Array} - Array of supported language codes
 */
function getSupportedLanguages() {
  // Get unique language codes from the first element's translations
  const firstElement = Object.values(ELEMENT_TRANSLATIONS)[0];
  return Object.keys(firstElement);
}

module.exports = {
  ELEMENT_TRANSLATIONS,
  INITIAL_ELEMENTS_CONFIG,
  getElementName,
  getInitialElements,
  getSupportedLanguages
};
