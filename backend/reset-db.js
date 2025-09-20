const mongoose = require('./db.js');
const { ElementCache, InitialElementsAudio } = require('./schema.js');
const { textToSpeech } = require('./tts.js');
const { getSupportedLanguages, getElementName, INITIAL_ELEMENTS_CONFIG } = require('./languages.js');

// Basic element combinations to seed the database
const basicCombinations = [
  // Classical elements - core natural processes
  { element1: 'fire', element2: 'water', result: { element: 'Steam', emoji: '💨' } },
  { element1: 'earth', element2: 'water', result: { element: 'Plant', emoji: '🌱' } },
  { element1: 'earth', element2: 'fire', result: { element: 'Sand', emoji: '🏖️' } },
  { element1: 'air', element2: 'water', result: { element: 'Cloud', emoji: '☁️' } },
  { element1: 'air', element2: 'earth', result: { element: 'Dust', emoji: '💨' } },

  // Material progression
  { element1: 'fire', element2: 'stone', result: { element: 'Metal', emoji: '⚙️' } },
  { element1: 'stone', element2: 'stone', result: { element: 'Brick', emoji: '🧱' } },
  { element1: 'dust', element2: 'water', result: { element: 'Mud', emoji: '🟤' } },

  // Metal & Tools
  { element1: 'metal', element2: 'fire', result: { element: 'Sword', emoji: '⚔️' } },
  { element1: 'metal', element2: 'metal', result: { element: 'Machine', emoji: '🤖' } },
  { element1: 'axe', element2: 'tree', result: { element: 'Wood', emoji: '🪵' } },
  { element1: 'pickaxe', element2: 'stone', result: { element: 'Pebbles', emoji: '🪨' } },

  // Nature progression
  { element1: 'plant', element2: 'plant', result: { element: 'Tree', emoji: '🌳' } },
  { element1: 'tree', element2: 'fire', result: { element: 'Ash', emoji: '🌫️' } },
  { element1: 'wood', element2: 'fire', result: { element: 'Ash', emoji: '🌫️' } },

  // Weather
  { element1: 'cloud', element2: 'cloud', result: { element: 'Storm', emoji: '⛈️' } },
  { element1: 'storm', element2: 'storm', result: { element: 'Lightning', emoji: '⚡' } },

  // Advanced
  { element1: 'sand', element2: 'air', result: { element: 'Desert', emoji: '🏜️' } },
  { element1: 'sand', element2: 'fire', result: { element: 'Glass', emoji: '🔍' } },
  { element1: 'lightning', element2: 'metal', result: { element: 'Electricity', emoji: '🔌' } }
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
          
          // Create result with translated name and audio
          const result = {
            element: translatedResult, // Use translated name
            en_text: combo.result.element, // Keep original English name for target matching
            emoji: combo.result.emoji,
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
