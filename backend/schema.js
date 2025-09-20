const mongoose = require('mongoose');

// Duel Request Schema - for pending duel invitations
const duelRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date }
});

// Duel Schema - for ongoing and finished duels
const duelSchema = new mongoose.Schema({
  player1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['ongoing', 'finished'], 
    default: 'ongoing' 
  },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date }
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  duels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Duel' }],
  duelRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DuelRequest' }],
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
const Duel = mongoose.model("Duel", duelSchema);
const DuelRequest = mongoose.model("DuelRequest", duelRequestSchema);
const ElementCache = mongoose.model("ElementCache", elementCacheSchema);
const InitialElementsAudio = mongoose.model("InitialElementsAudio", initialElementsAudioSchema);

module.exports = { User, Duel, DuelRequest, ElementCache, InitialElementsAudio };