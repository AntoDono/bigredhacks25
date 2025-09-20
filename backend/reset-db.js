const mongoose = require('./db.js');
const { ElementCache } = require('./schema.js');

// Basic element combinations to seed the database
const basicCombinations = [
    // Classical elements
    { element1: 'fire', element2: 'water', result: { element: 'Steam', emoji: '💨' } },
    { element1: 'earth', element2: 'water', result: { element: 'Mud', emoji: '🟤' } },
    { element1: 'earth', element2: 'fire', result: { element: 'Lava', emoji: '🌋' } },
    { element1: 'air', element2: 'water', result: { element: 'Cloud', emoji: '☁️' } },
    { element1: 'air', element2: 'earth', result: { element: 'Dust', emoji: '💨' } },

    // Material combinations
    { element1: 'lava', element2: 'water', result: { element: 'Obsidian', emoji: '⚫' } },
    { element1: 'water', element2: 'lava', result: { element: 'Stone', emoji: '🪨' } },
    { element1: 'steam', element2: 'steam', result: { element: 'Cloud', emoji: '☁️' } },
    { element1: 'dust', element2: 'water', result: { element: 'Clay', emoji: '🏺' } },
    { element1: 'stone', element2: 'stone', result: { element: 'Rock', emoji: '🪨' } },
    { element1: 'clay', element2: 'fire', result: { element: 'Brick', emoji: '🧱' } },

    // Metal progression
    { element1: 'stone', element2: 'fire', result: { element: 'Metal', emoji: '⚙️' } },
    { element1: 'metal', element2: 'fire', result: { element: 'Steel', emoji: '🔩' } },
    { element1: 'metal', element2: 'metal', result: { element: 'Blade', emoji: '⚔️' } },

    // Nature progression
    { element1: 'earth', element2: 'water', result: { element: 'Plant', emoji: '🌱' } },
    { element1: 'plant', element2: 'plant', result: { element: 'Tree', emoji: '🌳' } },
    { element1: 'tree', element2: 'fire', result: { element: 'Ash', emoji: '🌫️' } },
    { element1: 'tree', element2: 'metal', result: { element: 'Tool', emoji: '🔧' } },

    // Weather
    { element1: 'cloud', element2: 'cloud', result: { element: 'Storm', emoji: '⛈️' } },
    { element1: 'water', element2: 'air', result: { element: 'Ice', emoji: '🧊' } },
    { element1: 'ice', element2: 'fire', result: { element: 'Water', emoji: '💧' } },
    { element1: 'cloud', element2: 'fire', result: { element: 'Lightning', emoji: '⚡' } },

    // Advanced
    { element1: 'dust', element2: 'dust', result: { element: 'Sand', emoji: '⏳' } },
    { element1: 'sand', element2: 'fire', result: { element: 'Glass', emoji: '🔍' } },
    { element1: 'lightning', element2: 'metal', result: { element: 'Electricity', emoji: '🔌' } },
    { element1: 'stone', element2: 'pressure', result: { element: 'Diamond', emoji: '💎' } }
];

async function resetElementCache() {
  try {
    console.log('🗑️  Clearing element cache...');
    
    // Clear all existing cache entries
    const deleteResult = await ElementCache.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} cached elements`);
    
    console.log('💾 Injecting basic element combinations...');
    
    // Insert basic combinations
    for (const combo of basicCombinations) {
      // Normalize the element names (lowercase and sorted)
      const [first, second] = [combo.element1.toLowerCase(), combo.element2.toLowerCase()].sort();
      
      const cacheEntry = new ElementCache({
        element1: first,
        element2: second,
        result: combo.result
      });
      
      await cacheEntry.save();
      console.log(`   ✅ ${first} + ${second} = ${combo.result.element} ${combo.result.emoji}`);
    }
    
    console.log(`\n🎉 Successfully reset database with ${basicCombinations.length} basic combinations!`);
    console.log('\nBasic starter elements available:');
    console.log('   🔥 Fire    💧 Water    🌍 Earth    💨 Air');
    
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
