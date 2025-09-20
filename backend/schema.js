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

// Create models
const User = mongoose.model("User", userSchema);
const Duel = mongoose.model("Duel", duelSchema);
const DuelRequest = mongoose.model("DuelRequest", duelRequestSchema);

module.exports = { User, Duel, DuelRequest };