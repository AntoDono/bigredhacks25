const mongoose = require('./db.js');
const { ElementCache, InitialElementsAudio } = require('./schema.js');
const { textToSpeech } = require('./tts.js');
const { getSupportedLanguages, getElementName, INITIAL_ELEMENTS_CONFIG } = require('./languages.js');

// Basic element combinations to seed the database
// Basic element combinations to seed the database
const basicCombinations = [
  // Classical elements - core natural processes
  { element1: 'fire', element2: 'water', result: { element: 'Steam', en_text: 'Steam', emoji: '💨', phonetics: 'steem' } },
  { element1: 'fire', element2: 'fire', result: { element: 'Lava', en_text: 'Lava', emoji: '🌋', phonetics: 'lah-vah' } },
  { element1: 'earth', element2: 'water', result: { element: 'Plant', en_text: 'Plant', emoji: '🌱', phonetics: 'plant' } },
  { element1: 'earth', element2: 'fire', result: { element: 'Sand', en_text: 'Sand', emoji: '🏖️', phonetics: 'sand' } },
  { element1: 'air', element2: 'water', result: { element: 'Cloud', en_text: 'Cloud', emoji: '☁️', phonetics: 'klowd' } },
  { element1: 'air', element2: 'earth', result: { element: 'Dust', en_text: 'Dust', emoji: '💨', phonetics: 'dust' } },

  // Material progression
  { element1: 'fire', element2: 'stone', result: { element: 'Metal', en_text: 'Metal', emoji: '⚙️', phonetics: 'meh-tal' } },
  { element1: 'stone', element2: 'stone', result: { element: 'Pressure', en_text: 'Pressure', emoji: '🔨', phonetics: 'presh-ur' } },
  { element1: 'dust', element2: 'water', result: { element: 'Mud', en_text: 'Mud', emoji: '🟤', phonetics: 'mud' } },
  { element1: 'mud', element2: 'fire', result: { element: 'Brick', en_text: 'Brick', emoji: '🧱', phonetics: 'brick' } },

  // Metal & Tools
  { element1: 'metal', element2: 'fire', result: { element: 'Sword', en_text: 'Sword', emoji: '⚔️', phonetics: 'sord' } },
  { element1: 'metal', element2: 'metal', result: { element: 'Machine', en_text: 'Machine', emoji: '🤖', phonetics: 'mah-sheen' } },
  { element1: 'axe', element2: 'tree', result: { element: 'Wood', en_text: 'Wood', emoji: '🪵', phonetics: 'wood' } },
  { element1: 'pickaxe', element2: 'stone', result: { element: 'Pebbles', en_text: 'Pebbles', emoji: '🪨', phonetics: 'peb-uls' } },

  // Nature progression
  { element1: 'plant', element2: 'plant', result: { element: 'Tree', en_text: 'Tree', emoji: '🌳', phonetics: 'tree' } },
  { element1: 'tree', element2: 'fire', result: { element: 'Ash', en_text: 'Ash', emoji: '🌫️', phonetics: 'ash' } },
  { element1: 'wood', element2: 'fire', result: { element: 'Ash', en_text: 'Ash', emoji: '🌫️', phonetics: 'ash' } },

  // Weather
  { element1: 'cloud', element2: 'cloud', result: { element: 'Storm', en_text: 'Storm', emoji: '⛈️', phonetics: 'storm' } },
  { element1: 'storm', element2: 'storm', result: { element: 'Lightning', en_text: 'Lightning', emoji: '⚡', phonetics: 'lie-ting' } },

  // Advanced
  { element1: 'sand', element2: 'air', result: { element: 'Desert', en_text: 'Desert', emoji: '🏜️', phonetics: 'dez-ert' } },
  { element1: 'sand', element2: 'fire', result: { element: 'Glass', en_text: 'Glass', emoji: '🔍', phonetics: 'glass' } },
  { element1: 'lightning', element2: 'metal', result: { element: 'Electricity', en_text: 'Electricity', emoji: '🔌', phonetics: 'ee-lek-tris-ih-tee' } },
  
  // Missing target elements
  { element1: 'lava', element2: 'air', result: { element: 'Obsidian', en_text: 'Obsidian', emoji: '⚫', phonetics: 'ob-sid-ee-an' } },
  { element1: 'lava', element2: 'earth', result: { element: 'Volcano', en_text: 'Volcano', emoji: '🌋', phonetics: 'vol-kay-no' } },
  { element1: 'water', element2: 'water', result: { element: 'Ocean', en_text: 'Ocean', emoji: '🌊', phonetics: 'oh-shan' } },
  { element1: 'tree', element2: 'tree', result: { element: 'Forest', en_text: 'Forest', emoji: '🌲', phonetics: 'for-est' } },
  { element1: 'stone', element2: 'earth', result: { element: 'Mountain', en_text: 'Mountain', emoji: '⛰️', phonetics: 'mown-tin' } },
  { element1: 'wood', element2: 'stone', result: { element: 'House', en_text: 'House', emoji: '🏠', phonetics: 'hows' } },
  { element1: 'pressure', element2: 'stone', result: { element: 'Diamond', en_text: 'Diamond', emoji: '💎', phonetics: 'die-mund' } },
  { element1: 'wood', element2: 'metal', result: { element: 'Tool', en_text: 'Tool', emoji: '🔧', phonetics: 'tool' } },
  { element1: 'house', element2: 'stone', result: { element: 'Castle', en_text: 'Castle', emoji: '🏰', phonetics: 'kas-ul' } }
];
/**
 * Generate audio for an element in a specific language
 * @param {string} elementName - Name of the element
 * @param {string} languageCode - Language code
 * @returns {Promise<string|null>} - Base64 audio or null if failed
 */
async function generateAudioForElement(elementName, languageCode) {
  try {
    const audio = await textToSpeech(languageCode, elementName);
    return audio;
  } catch (error) {
    console.warn(`   ⚠️  Failed to generate audio for "${elementName}" in ${languageCode}:`, error.message);
    return null;
  }
}

/**
 * Generate phonetics for an element in a specific language
 * @param {string} elementName - Name of the element
 * @param {string} languageCode - Language code
 * @returns {string} - English pronunciation guide
 */
function generatePhonetics(elementName, languageCode) {
  // For now, use a simple fallback phonetics generation
  // In a real implementation, you might want to use a more sophisticated approach
  // or call an external service for better phonetics
  
  // Simple phonetic mapping for common patterns
  const phoneticMappings = {
    // Spanish patterns
    'll': 'y',
    'ñ': 'ny',
    'j': 'h',
    'h': '', // silent h in Spanish
    'qu': 'k',
    'c': 'k', // before a, o, u
    'z': 's',
    
    // French patterns
    'eau': 'oh',
    'ou': 'oo',
    'ch': 'sh',
    'gn': 'ny',
    'qu': 'k',
    
    // German patterns
    'sch': 'sh',
    'ch': 'kh',
    'ü': 'ue',
    'ö': 'oe',
    'ä': 'ae',
    
    // Chinese/Japanese patterns (simplified)
    'x': 'sh',
    'q': 'ch',
    'zh': 'j',
    'ch': 'ch',
    'sh': 'sh',
  };
  
  let phonetics = elementName.toLowerCase();
  
  // Apply phonetic mappings
  for (const [pattern, replacement] of Object.entries(phoneticMappings)) {
    phonetics = phonetics.replace(new RegExp(pattern, 'g'), replacement);
  }
  
  // Add hyphens between syllables (simple heuristic)
  phonetics = phonetics.replace(/([aeiou])([bcdfghjklmnpqrstvwxyz])/g, '$1-$2');
  phonetics = phonetics.replace(/([bcdfghjklmnpqrstvwxyz])([aeiou])/g, '$1-$2');
  
  // Clean up multiple hyphens
  phonetics = phonetics.replace(/-+/g, '-');
  phonetics = phonetics.replace(/^-|-$/g, '');
  
  return phonetics || elementName.toLowerCase();
}

async function resetElementCache() {
  try {
    console.log('🗑️  Clearing element cache...');
    
    // Clear all existing cache entries
    const deleteResult = await ElementCache.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} cached elements`);
    
    // Clear initial elements audio
    const deleteAudioResult = await InitialElementsAudio.deleteMany({});
    console.log(`   Deleted ${deleteAudioResult.deletedCount} initial element audio entries`);
    
    console.log('💾 Injecting basic element combinations with multilingual audio...');
    
    const supportedLanguages = getSupportedLanguages();
    console.log(`   🌍 Generating audio for ${supportedLanguages.length} languages: ${supportedLanguages.join(', ')}`);
    
    // Insert basic combinations for each language
    for (const combo of basicCombinations) {
      
      // For each supported language, create a cache entry with English element names but translated results
      for (const languageCode of supportedLanguages) {
        try {
          // Use English element names for cache keys (for consistency across languages)
          const [first, second] = [combo.element1.toLowerCase(), combo.element2.toLowerCase()].sort();
          
          // Get translated result element name
          const translatedResult = getElementName(combo.result.element.toLowerCase(), languageCode);
          
          // Generate audio for the result element in this language
          console.log(`   🎵 Generating audio for "${translatedResult}" (${languageCode})...`);
          const audioB64 = await generateAudioForElement(translatedResult, languageCode);
          
          // Generate phonetics for the translated element
          const phonetics = generatePhonetics(translatedResult, languageCode);
          
          // Create result with translated name and audio
          const result = {
            element: translatedResult, // Use translated name
            en_text: combo.result.element, // Keep original English name for target matching
            emoji: combo.result.emoji,
            phonetics: phonetics, // Add phonetics for pronunciation guide
            audio_b64: audioB64
          };
          
          const cacheEntry = new ElementCache({
            element1: first,
            element2: second,
            result: result,
            languageCode: languageCode
          });
          
          await cacheEntry.save();
          
          const audioStatus = audioB64 ? '🔊' : '🔇';
          console.log(`   ✅ [${languageCode}] ${first} + ${second} = ${translatedResult} ${combo.result.emoji} ${audioStatus}`);
          
        } catch (error) {
          console.error(`   ❌ Failed to create cache entry for ${languageCode}:`, error.message);
        }
      }
    }
    
    const totalEntries = basicCombinations.length * supportedLanguages.length;
    console.log(`\n🎉 Successfully reset database with ${totalEntries} multilingual combinations!`);
    console.log(`   📊 ${basicCombinations.length} combinations × ${supportedLanguages.length} languages`);
    
    // Generate audio for initial elements
    console.log('\n🎵 Generating audio for initial elements...');
    
    for (const languageCode of supportedLanguages) {
      for (const element of INITIAL_ELEMENTS_CONFIG) {
        try {
          const translatedName = getElementName(element.id, languageCode);
          const audioB64 = await generateAudioForElement(translatedName, languageCode);
          
          const audioEntry = new InitialElementsAudio({
            elementKey: element.id,
            languageCode: languageCode,
            elementName: translatedName,
            audio_b64: audioB64
          });
          
          await audioEntry.save();
          
          const audioStatus = audioB64 ? '🔊' : '🔇';
          console.log(`   ✅ [${languageCode}] ${element.id} → ${translatedName} ${audioStatus}`);
          
        } catch (error) {
          console.error(`   ❌ Failed to create audio for ${element.id} in ${languageCode}:`, error.message);
        }
      }
    }
    
    console.log('\nBasic starter elements available:');
    console.log('   🔥 Fire    💧 Water    🌍 Earth    💨 Air');
    console.log('   🪓 Axe     ⛏️  Pickaxe  🔬 Stemcell 🌳 Tree    🪨 Stone');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
}

// Run the reset function
resetElementCache();
