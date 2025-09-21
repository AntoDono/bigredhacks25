const mongoose = require('./db.js');
const { ElementCache, InitialElementsAudio } = require('./schema.js');
const { textToSpeech } = require('./tts.js');
const { getSupportedLanguages, getElementName, INITIAL_ELEMENTS_CONFIG } = require('./languages.js');

// Basic element combinations to seed the database
// Basic element combinations to seed the database
const basicCombinations = [
  // Core elements - fundamental interactions
  { element1: 'fire', element2: 'water', result: { element: 'steam', en_text: 'Steam', emoji: '💨', phonetics: 'steem' } },
  { element1: 'earth', element2: 'water', result: { element: 'plant', en_text: 'Plant', emoji: '🌱', phonetics: 'plant' } },
  { element1: 'wind', element2: 'water', result: { element: 'cloud', en_text: 'Cloud', emoji: '☁️', phonetics: 'klowd' } },
  { element1: 'earth', element2: 'fire', result: { element: 'lava', en_text: 'Lava', emoji: '🌋', phonetics: 'lah-vah' } },
  { element1: 'wind', element2: 'earth', result: { element: 'dust', en_text: 'Dust', emoji: '💨', phonetics: 'dust' } },

  // Secondary combinations from basics
  { element1: 'fire', element2: 'fire', result: { element: 'lava', en_text: 'Lava', emoji: '🌋', phonetics: 'lah-vah' } },
  { element1: 'water', element2: 'water', result: { element: 'ocean', en_text: 'Ocean', emoji: '🌊', phonetics: 'oh-shan' } },
  { element1: 'dust', element2: 'water', result: { element: 'mud', en_text: 'Mud', emoji: '🟤', phonetics: 'mud' } },
  { element1: 'mud', element2: 'fire', result: { element: 'stone', en_text: 'Stone', emoji: '🪨', phonetics: 'stone' } },

  // Weather systems
  { element1: 'cloud', element2: 'cloud', result: { element: 'storm', en_text: 'Storm', emoji: '⛈️', phonetics: 'storm' } },
  { element1: 'storm', element2: 'fire', result: { element: 'lightning', en_text: 'Lightning', emoji: '⚡', phonetics: 'lie-ting' } },
  { element1: 'lightning', element2: 'metal', result: { element: 'electricity', en_text: 'Electricity', emoji: '🔌', phonetics: 'ee-lek-tris-ih-tee' } },

  // Nature progression
  { element1: 'plant', element2: 'plant', result: { element: 'tree', en_text: 'Tree', emoji: '🌳', phonetics: 'tree' } },
  { element1: 'tree', element2: 'tree', result: { element: 'forest', en_text: 'Forest', emoji: '🌲', phonetics: 'for-est' } },
  { element1: 'stone', element2: 'stone', result: { element: 'mountain', en_text: 'Mountain', emoji: '⛰️', phonetics: 'mown-tin' } },

  // Materials and crafting
  { element1: 'stone', element2: 'fire', result: { element: 'metal', en_text: 'Metal', emoji: '⚙️', phonetics: 'meh-tal' } },
  { element1: 'lava', element2: 'wind', result: { element: 'obsidian', en_text: 'Obsidian', emoji: '⚫', phonetics: 'ob-sid-ee-an' } },
  { element1: 'lava', element2: 'water', result: { element: 'stone', en_text: 'Stone', emoji: '🪨', phonetics: 'stone' } },
  { element1: 'fire', element2: 'stone', result: { element: 'glass', en_text: 'Glass', emoji: '🔍', phonetics: 'glass' } },
  { element1: 'wind', element2: 'fire', result: { element: 'desert', en_text: 'Desert', emoji: '🏜️', phonetics: 'dez-ert' } },

  // Tools and construction
  { element1: 'metal', element2: 'fire', result: { element: 'sword', en_text: 'Sword', emoji: '⚔️', phonetics: 'sord' } },
  { element1: 'metal', element2: 'stone', result: { element: 'tool', en_text: 'Tool', emoji: '🔧', phonetics: 'tool' } },
  { element1: 'metal', element2: 'metal', result: { element: 'machine', en_text: 'Machine', emoji: '🤖', phonetics: 'mah-sheen' } },
  { element1: 'stone', element2: 'plant', result: { element: 'house', en_text: 'House', emoji: '🏠', phonetics: 'hows' } },
  { element1: 'house', element2: 'stone', result: { element: 'castle', en_text: 'Castle', emoji: '🏰', phonetics: 'kas-ul' } },

  // Advanced materials
  { element1: 'stone', element2: 'stone', result: { element: 'pressure', en_text: 'Pressure', emoji: '🔨', phonetics: 'presh-ur' } },
  { element1: 'pressure', element2: 'fire', result: { element: 'diamond', en_text: 'Diamond', emoji: '💎', phonetics: 'die-mund' } },
  { element1: 'lava', element2: 'earth', result: { element: 'volcano', en_text: 'Volcano', emoji: '🌋', phonetics: 'vol-kay-no' } }
];

/**
 * Generate inverse combinations for all basic combinations
 * This ensures that element1 + element2 = element2 + element1
 * @param {Array} combinations - Array of basic combinations
 * @returns {Array} - Array with both original and inverse combinations
 */
function generateInverseCombinations(combinations) {
  const allCombinations = [...combinations]; // Start with original combinations
  
  for (const combo of combinations) {
    // Skip if it's already a same-element combination (e.g., fire + fire)
    if (combo.element1 === combo.element2) {
      continue;
    }
    
    // Create inverse combination
    const inverseCombo = {
      element1: combo.element2,
      element2: combo.element1,
      result: combo.result // Same result
    };
    
    // Add inverse if it doesn't already exist
    const inverseExists = allCombinations.some(existing => 
      existing.element1 === inverseCombo.element1 && 
      existing.element2 === inverseCombo.element2
    );
    
    if (!inverseExists) {
      allCombinations.push(inverseCombo);
    }
  }
  
  return allCombinations;
}

// Generate all combinations including inverses
const allCombinations = generateInverseCombinations(basicCombinations);
console.log(`📋 Generated ${basicCombinations.length} basic combinations + ${allCombinations.length - basicCombinations.length} inverse combinations = ${allCombinations.length} total combinations`);

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
    
    // First, collect all unique results to generate audio/phonetics only once per result
    const uniqueResults = new Map();
    for (const combo of allCombinations) {
      const resultKey = combo.result.element.toLowerCase();
      if (!uniqueResults.has(resultKey)) {
        uniqueResults.set(resultKey, combo.result);
      }
    }
    
    console.log(`   🎯 Found ${uniqueResults.size} unique results to process`);
    
    // Generate audio and phonetics for each unique result once per language
    const resultAudioCache = new Map(); // Cache audio/phonetics by result+language
    for (const [resultKey, result] of uniqueResults) {
      for (const languageCode of supportedLanguages) {
        try {
          const translatedResult = getElementName(resultKey, languageCode);
          const cacheKey = `${resultKey}-${languageCode}`;
          
          console.log(`   🎵 Generating audio for "${translatedResult}" (${languageCode})...`);
          const audioB64 = await generateAudioForElement(translatedResult, languageCode);
          const phonetics = generatePhonetics(translatedResult, languageCode);
          
          resultAudioCache.set(cacheKey, {
            element: translatedResult,
            phonetics: phonetics,
            audio_b64: audioB64
          });
          
          const audioStatus = audioB64 ? '🔊' : '🔇';
          console.log(`   ✅ Generated audio for "${translatedResult}" ${audioStatus}`);
          
        } catch (error) {
          console.error(`   ❌ Failed to generate audio for ${resultKey} in ${languageCode}:`, error.message);
        }
      }
    }
    
    // Now create cache entries for all combinations, reusing the generated audio/phonetics
    for (const combo of allCombinations) {
      for (const languageCode of supportedLanguages) {
        try {
          // Use English element names for cache keys (for consistency across languages)
          const [first, second] = [combo.element1.toLowerCase(), combo.element2.toLowerCase()].sort();
          const resultKey = combo.result.element.toLowerCase();
          const cacheKey = `${resultKey}-${languageCode}`;
          
          // Get the pre-generated audio and phonetics
          const audioData = resultAudioCache.get(cacheKey);
          if (!audioData) {
            console.warn(`   ⚠️  No audio data found for ${resultKey} in ${languageCode}, skipping...`);
            continue;
          }
          
          // Create result with translated name and cached audio/phonetics
          const result = {
            element: audioData.element,
            en_text: combo.result.element, // Keep original English name for target matching
            emoji: combo.result.emoji,
            phonetics: audioData.phonetics,
            audio_b64: audioData.audio_b64
          };
          
          const cacheEntry = new ElementCache({
            element1: first,
            element2: second,
            result: result,
            languageCode: languageCode
          });
          
          await cacheEntry.save();
          
          const audioStatus = audioData.audio_b64 ? '🔊' : '🔇';
          console.log(`   ✅ [${languageCode}] ${first} + ${second} = ${audioData.element} ${combo.result.emoji} ${audioStatus}`);
          
        } catch (error) {
          console.error(`   ❌ Failed to create cache entry for ${languageCode}:`, error.message);
        }
      }
    }
    
    const totalEntries = allCombinations.length * supportedLanguages.length;
    console.log(`\n🎉 Successfully reset database with ${totalEntries} multilingual combinations!`);
    console.log(`   📊 ${allCombinations.length} combinations × ${supportedLanguages.length} languages`);
    
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
