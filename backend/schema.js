const mongoose = require('mongoose');

// Game Schema - for completed battles/games
const gameSchema = new mongoose.Schema({
  players: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    score: { type: Number, default: 0 },
    elementsDiscovered: { type: Number, default: 0 }
  }],
  winner: { 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String }
  },
  targetElement: { type: String, required: true },
  roomName: { type: String, required: true },
  language: { type: String, default: 'en-US' },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true },
  duration: { type: Number }, // Duration in seconds
  createdAt: { type: Date, default: Date.now }
});

// Learned vocabulary item schema - matches element cache format
const learnedVocabularyItemSchema = new mongoose.Schema({
  elementKey: { type: String, required: true }, // English key (e.g., 'water', 'fire')
  element: { type: String, required: true }, // Translated element name (e.g., '水', 'Agua')
  en_text: { type: String, required: true }, // English element name for reference
  emoji: { type: String, required: true }, // Element emoji
  audio_b64: { type: String }, // Base64 encoded audio for pronunciation
  learnedAt: { type: Date, default: Date.now } // When the user first learned this
}, { _id: false }); // No separate _id for subdocuments

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gamesWon: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
  
  // Learned vocabulary organized by language
  learnedVocabulary: {
    type: Map,
    of: [learnedVocabularyItemSchema], // Array of vocabulary items per language
    default: new Map()
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Element Combination Cache Schema - for caching LLM responses
const elementCacheSchema = new mongoose.Schema({
  element1: { type: String, required: true },
  element2: { type: String, required: true },
  result: {
    element: { type: String, required: true }, // Translated element name
    en_text: { type: String, required: true }, // English element name for target matching
    emoji: { type: String, required: true },
    audio_b64: { type: String } // Base64 encoded audio for TTS
  },
  languageCode: { type: String, default: 'en-US' }, // Language for TTS audio
  createdAt: { type: Date, default: Date.now }
});

// Create compound index for efficient lookups (order-independent, language-aware)
elementCacheSchema.index({ 
  element1: 1, 
  element2: 1,
  languageCode: 1
});

// Initial Elements Audio Schema - for storing TTS audio of starter elements
const initialElementsAudioSchema = new mongoose.Schema({
  elementKey: { type: String, required: true }, // English key (e.g., 'water', 'fire')
  languageCode: { type: String, required: true }, // Language code
  elementName: { type: String, required: true }, // Translated name
  audio_b64: { type: String }, // Base64 encoded audio
  createdAt: { type: Date, default: Date.now }
});

// Index for efficient lookups
initialElementsAudioSchema.index({ 
  elementKey: 1, 
  languageCode: 1 
});

// Create models
const User = mongoose.model("User", userSchema);
const Game = mongoose.model("Game", gameSchema);
const ElementCache = mongoose.model("ElementCache", elementCacheSchema);
const InitialElementsAudio = mongoose.model("InitialElementsAudio", initialElementsAudioSchema);

module.exports = { User, Game, ElementCache, InitialElementsAudio };