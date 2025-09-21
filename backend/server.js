const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const { create_element } = require('./llm');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('./db'); // Connect to database
const { User, Game, InitialElementsAudio } = require('./schema');
const { getInitialElements } = require('./languages');
const { analyzePronunciation } = require('./voice-recognition-client');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Configure this properly in production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 7758;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';


// Middleware
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

var target_elements = [
    'house',
    'sword',
    'cloud',
    'electricity',
    'plant',
    'metal',
    'glass',
    'storm',
    'lightning',
    'diamond',
    'obsidian',
    'tool',
    'machine',
    'volcano',
    'ocean',
    'forest',
    'mountain',
    'desert',
    'castle'
]

var rooms = {}
/*
rooms = {
    "random-room-id": {
        "name": "Room 1",
        "description": "Room 1 description",
        "target_element": "element1",
        "players": {
            "id1": {
                "name": "Player Name 1",
                "joinedAt": Date
            },
            "id2": {
                "name": "Player Name 2", 
                "joinedAt": Date
            },
            "id3": {
                "name": "Player Name 3",
                "joinedAt": Date
            }
        },
        "player_stats": {
            "id1": {
                "score": 0,
                "elements": []
            },
            "id2": {
                "score": 0,
                "elements": []
            },
            "id3": {
                "score": 0,
                "elements": []
            }
        },
        "gameStatus": "waiting", // 'waiting', 'active', or 'ended'
        "winner": null,
        "createdBy": {
            "userId": "id1",
            "userName": "Creator Name"
        },
        "createdAt": Date,
        "startedAt": Date, // When game started
        "endedAt": Date,   // When game ended
        "timeoutId": null  // Store timeout ID for cleanup
    }
}
*/

// Game configuration
const GAME_CONFIG = {
  BATTLE_DURATION: 120, // 2 minutes in seconds
};

// Store connected users
var connectedUsers = {}; // { socketId: { userId, user, roomId } }

// Socket.IO authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user info to socket
    socket.userId = user._id.toString();
    socket.user = user;
    
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

// Apply authentication middleware to Socket.IO
io.use(socketAuth);

// Utility functions
const getRandomTargetElement = () => {
  const randomIndex = Math.floor(Math.random() * target_elements.length);
  return target_elements[randomIndex];
};

const createNewRoom = (roomId, roomName, roomDescription, creatorSocket, language = 'en-US') => {
  console.log("Creating new room", roomId, roomName, roomDescription, creatorSocket, language);
  const targetElement = getRandomTargetElement();
  
  const newRoom = {
    name: roomName || `Room ${roomId}`,
    description: roomDescription || `Room ${roomId} description`,
    target_element: targetElement,
    language: language, // Store the room's language for TTS
    players: {}, // Changed to object to store both ID and name
    player_stats: {},
    gameStatus: 'waiting', // 'waiting', 'active', or 'ended'
    winner: null,
    createdBy: {
      userId: creatorSocket.userId,
      userName: creatorSocket.user.name
    },
    createdAt: new Date()
  };
  
  rooms[roomId] = newRoom;
  console.log(`🎯 Room ${roomId} created by ${creatorSocket.user.name} with target element: ${targetElement}, language: ${language}`);
  
  return newRoom;
};

const addPlayerToRoom = (socket, roomId) => {
  const room = rooms[roomId];
  if (!room) return false;
  
  // Add user to room if not already in it
  if (!room.players[socket.userId]) {
    room.players[socket.userId] = {
      name: socket.user.name,
      joinedAt: new Date()
    };
    room.player_stats[socket.userId] = {
      score: 0,
      elements: []
    };
  }
  
  return true;
};

const removePlayerFromRoom = (userId, roomId) => {
  const room = rooms[roomId];
  if (!room) return false;
  
  // Remove user from room
  if (room.players[userId]) {
    delete room.players[userId];
  }
  
  // Remove player stats
  if (room.player_stats[userId]) {
    delete room.player_stats[userId];
  }
  
  return true;
};

// Helper function to save element to user's vocabulary
async function saveToUserVocabulary(userId, elementData, languageCode) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User ${userId} not found for vocabulary update`);
      return;
    }

    // Initialize learnedVocabulary Map if it doesn't exist
    if (!user.learnedVocabulary) {
      user.learnedVocabulary = new Map();
    }

    // Get existing vocabulary for this language or initialize empty array
    const existingVocabulary = user.learnedVocabulary.get(languageCode) || [];
    const existingKeys = new Set(existingVocabulary.map(item => item.elementKey));

    // Create element key from English name
    const elementKey = elementData.en_text || elementData.element.toLowerCase().replace(/\s+/g, '_');

    // Skip if we already have this element for this language
    if (existingKeys.has(elementKey)) {
      return;
    }

    // Add new vocabulary item
    const vocabularyItem = {
      elementKey,
      element: elementData.element, // Translated element name
      en_text: elementData.en_text || elementData.element, // English reference
      emoji: elementData.emoji || '✨',
      audio_b64: elementData.audio_b64 || null,
      learnedAt: new Date()
    };

    existingVocabulary.push(vocabularyItem);
    
    // Update the vocabulary for this language
    user.learnedVocabulary.set(languageCode, existingVocabulary);
    
    // Mark the field as modified for Map types
    user.markModified('learnedVocabulary');
    
    await user.save();
    
    console.log(`📚 Added to vocabulary: ${elementKey} -> ${elementData.element} (${languageCode}) for user ${userId}`);
    
  } catch (error) {
    console.error('Error saving to user vocabulary:', error);
  }
}

// Helper function to save completed game to database
async function saveGameToDatabase(room, roomId) {
  try {
    // Calculate game duration
    const duration = room.startedAt && room.endedAt ? 
      Math.floor((room.endedAt - room.startedAt) / 1000) : 0;

    // Prepare players array from room data
    const players = Object.entries(room.player_stats).map(([userId, stats]) => ({
      userId: userId,
      userName: room.players[userId]?.name || 'Unknown',
      score: stats.score || 0,
      elementsDiscovered: stats.elements?.length || 0
    }));

    // Find winner info (null if no winner)
    const winner = room.winner ? {
      userId: room.winner,
      userName: room.players[room.winner]?.name || 'Unknown'
    } : null;

    // Create game document
    const gameData = {
      players: players,
      targetElement: room.target_element,
      roomName: room.name || `Battle Room ${roomId}`,
      language: room.language || 'en-US',
      startedAt: room.startedAt || new Date(),
      endedAt: room.endedAt || new Date(),
      duration: duration
    };

    // Only add winner if there is one
    if (winner) {
      gameData.winner = winner;
    }

    const game = new Game(gameData);
    const savedGame = await game.save();

    // Update user statistics and add game reference
    const updatePromises = players.map(async (player) => {
      try {
        const user = await User.findById(player.userId);
        if (user) {
          user.gamesPlayed = (user.gamesPlayed || 0) + 1;
          if (room.winner && player.userId === room.winner) {
            user.gamesWon = (user.gamesWon || 0) + 1;
          }
          
          // Add game reference to user's games array
          if (!user.games) user.games = [];
          user.games.push(savedGame._id);
          
          await user.save();
          console.log(`📊 Updated stats for ${player.userName}: ${user.gamesWon}/${user.gamesPlayed} games`);
        }
      } catch (error) {
        console.error(`Error updating user stats for ${player.userId}:`, error);
      }
    });

    await Promise.all(updatePromises);

    console.log(`💾 Game saved to database: ${savedGame._id} - Winner: ${winner ? winner.userName : 'None'}, Duration: ${duration}s`);
    return savedGame;

  } catch (error) {
    console.error('Error saving game to database:', error);
  }
}

// Helper function to handle game timeout
async function handleGameTimeout(roomId) {
  try {
    const room = rooms[roomId];
    if (!room || room.gameStatus === 'ended') return;
    
    console.log(`⏰ Game timeout in room ${roomId}`);
    
    // End the game due to timeout
    room.gameStatus = 'ended';
    room.endedAt = new Date();
    
    // Find the player with the highest score as winner, or null if tie/no scores
    let winner = null;
    let highestScore = -1;
    let tiedPlayers = [];
    
    Object.entries(room.player_stats).forEach(([userId, stats]) => {
      if (stats.score > highestScore) {
        highestScore = stats.score;
        winner = userId;
        tiedPlayers = [userId];
      } else if (stats.score === highestScore) {
        tiedPlayers.push(userId);
      }
    });
    
    // If there's a tie or no one scored, pick the first player or null
    if (tiedPlayers.length > 1 && highestScore === 0) {
      winner = null; // No winner if everyone has 0 points
    } else if (tiedPlayers.length > 1) {
      winner = tiedPlayers[0]; // Pick first player in case of tie
    }
    
    room.winner = winner;
    
    // Save game to database
    await saveGameToDatabase(room, roomId);
    
    // Broadcast timeout to all players in room
    const timeoutData = {
      type: 'game-timeout',
      data: {
        message: 'Time\'s up! Game ended due to time limit.',
        winner: winner ? {
          userId: winner,
          userName: room.players[winner]?.name || 'Unknown'
        } : null,
        targetElement: room.target_element,
        finalScores: room.player_stats,
        gameEndTime: room.endedAt
      }
    };
    
    io.to(roomId).emit('message_broadcast', timeoutData);
    
    console.log(`⏰ Game timeout handled for room ${roomId}. Winner: ${winner ? room.players[winner]?.name : 'None'}`);
    
  } catch (error) {
    console.error('Error handling game timeout:', error);
  }
}

const checkForGameEnd = async(socket, roomId, createdElementData) => {
  const room = rooms[roomId];
  if (!room || room.gameStatus === 'ended') return false;
  
  // Check if created element matches target (using English text for comparison)
  const createdElementEnglish = createdElementData.en_text || createdElementData.element;
  if (createdElementEnglish.toLowerCase() === room.target_element.toLowerCase()) {
    // End the game
    room.gameStatus = 'ended';
    room.winner = socket.userId;
    room.endedAt = new Date();
    
    // Clear the timeout since game ended early
    if (room.timeoutId) {
      clearTimeout(room.timeoutId);
      room.timeoutId = null;
    }
    
    // Save game to database
    await saveGameToDatabase(room, roomId);
    
    // Broadcast endgame to all players in room
    socket.to(roomId).emit('message_broadcast', {
      type: 'endgame',
      data: {
        winner: {
          userId: socket.userId,
          userName: socket.user.name
        },
        targetElement: room.target_element,
        finalScores: room.player_stats,
        gameEndTime: room.endedAt
      }
    });
    
    // Send endgame to the winner too
    socket.emit('message_response', {
      type: 'endgame',
      success: true,
      message: `Congratulations! You won by creating the target element: ${room.target_element}`,
      data: {
        winner: {
          userId: socket.userId,
          userName: socket.user.name
        },
        targetElement: room.target_element,
        finalScores: room.player_stats,
        gameEndTime: room.endedAt
      }
    });
    
    console.log(`🏆 Game ended! ${socket.user.name} won room ${roomId} by creating ${createdElementEnglish}`);
    return true;
  }
  
  return false;
};

const handleStartGame = (socket, data) => {
  try {
    const userInfo = connectedUsers[socket.id];
    const roomId = userInfo?.roomId;
    
    if (!roomId || !rooms[roomId]) {
      socket.emit('message_response', {
        type: 'start-game',
        success: false,
        message: 'You are not in a room',
        data: null
      });
      return;
    }
    
    const room = rooms[roomId];
    
    // Check if user is the room creator
    if (room.createdBy.userId !== socket.userId) {
      socket.emit('message_response', {
        type: 'start-game',
        success: false,
        message: 'Only the room creator can start the game',
        data: null
      });
      return;
    }
    
    // Check if game is already active or ended
    if (room.gameStatus === 'active') {
      socket.emit('message_response', {
        type: 'start-game',
        success: false,
        message: 'Game is already active',
        data: null
      });
      return;
    }
    
    if (room.gameStatus === 'ended') {
      socket.emit('message_response', {
        type: 'start-game',
        success: false,
        message: 'Game has already ended',
        data: null
      });
      return;
    }
    
    // Start the game
    room.gameStatus = 'active';
    room.startedAt = new Date();
    
    // Set up game timeout
    room.timeoutId = setTimeout(async () => {
      await handleGameTimeout(roomId);
    }, GAME_CONFIG.BATTLE_DURATION * 1000); // Convert seconds to milliseconds
    
    // Broadcast game start to all players in room
    io.to(roomId).emit('message_broadcast', {
      type: 'game-started',
      data: {
        message: `Game started by ${socket.user.name}!`,
        targetElement: room.target_element,
        startedBy: socket.user.name,
        startTime: room.startedAt
      }
    });
    
    console.log(`🎮 Game started in room ${roomId} by ${socket.user.name}. Timeout set for ${GAME_CONFIG.BATTLE_DURATION} seconds.`);
    
  } catch (error) {
    console.error('Error starting game:', error);
    socket.emit('message_response', {
      type: 'start-game',
      success: false,
      message: 'Failed to start game',
      error: error.message,
      data: null
    });
  }
};

// Socket.IO message handlers
const validateCreateElementData = (data) => {
  const { element1, element2 } = data;
  return element1 && element2;
};

const updatePlayerStats = (socket, roomId, newElement) => {
  const room = rooms[roomId];
  if (!room || room.gameStatus === 'ended') return false;
  
  if (!room.player_stats[socket.userId].elements) {
    room.player_stats[socket.userId].elements = [];
  }
  
  // Add the new element to player's discovered elements if not already discovered
  if (!room.player_stats[socket.userId].elements.includes(newElement)) {
    room.player_stats[socket.userId].elements.push(newElement);
    room.player_stats[socket.userId].score += 10; // Award points for new discovery
    return true; // New element discovered
  }
  
  return false; // Element already known
};

const broadcastElementDiscovery = (socket, roomId, element, combination) => {
  const room = rooms[roomId];
  if (!room) return;
  
  socket.to(roomId).emit('message_broadcast', {
    type: 'player-discovered-element',
    data: {
      userId: socket.userId,
      userName: socket.user.name,
      element: element,
      combination: combination,
      newScore: room.player_stats[socket.userId].score
    }
  });
};

const handleCreateElement = async (socket, data) => {
  try {
    // Validate input
    if (!validateCreateElementData(data)) {
      socket.emit('message_response', {
        type: 'create-element',
        success: false,
        message: 'Both element1 and element2 are required',
        data: null
      });
      return;
    }

    const { element1, element2 } = data;
    console.log(`🧪 Creating element: ${element1} + ${element2} for user ${socket.user.name}`);
    
    // Get user's current room to determine language
    const userInfo = connectedUsers[socket.id];
    const roomId = userInfo?.roomId;
    const room = roomId ? rooms[roomId] : null;
    const languageCode = room?.language || 'en-US';
    
    // Call the create_element function from llm.js with the room's language
    const result = await create_element(element1, element2, languageCode);
    const newElement = result.element;
    const newEmoji = result.emoji;
    const audioB64 = result.audio_b64;
    const enText = result.en_text;
    const phonetics = result.phonetics;
    const combination = `${element1} + ${element2}`;
    
    let gameEnded = false;
    let roomStats = null;
    let isNewDiscovery = false;
    
    // Update player stats if user is in a room
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      
      // Check game status
      if (room.gameStatus === 'waiting') {
        socket.emit('message_response', {
          type: 'create-element',
          success: false,
          message: 'Game has not started yet. Waiting for room creator to start the game.',
          data: {
            element: newElement,
            gameStatus: 'waiting'
          }
        });
        return;
      }
      
      if (room.gameStatus === 'ended') {
        socket.emit('message_response', {
          type: 'create-element',
          success: false,
          message: 'Game has already ended',
          data: {
            element: newElement,
            gameStatus: 'ended',
            winner: room.winner
          }
        });
        return;
      }
      
      // Update player stats
      isNewDiscovery = updatePlayerStats(socket, roomId, newElement);
      
      roomStats = {
        score: room.player_stats[socket.userId].score,
        elementsDiscovered: room.player_stats[socket.userId].elements.length,
        targetElement: room.target_element,
        gameStatus: room.gameStatus
      };
    }
    
    // ALWAYS send success response back to the user first
    socket.emit('message_response', {
      type: 'create-element',
      success: true,
      message: 'Element created successfully',
      data: {
        element: newElement,
        en_text: enText, // Include English text for target matching and display
        emoji: newEmoji,
        phonetics: phonetics, // Include phonetics for pronunciation guide
        combination: combination,
        audio_b64: audioB64,
        ...(roomStats ? { roomStats } : {})
      }
    });
    
    // If it's a new discovery, broadcast to room
    if (roomId && isNewDiscovery) {
      broadcastElementDiscovery(socket, roomId, newElement, combination);
    }
    
    // THEN check for game end condition (after element is sent)
    if (roomId) {
      gameEnded = await checkForGameEnd(socket, roomId, result);
    }
    
    console.log(`✨ Element created: ${newElement} by ${socket.user.name}`);
    
    // Save element to user's vocabulary (languageCode already declared above)
    await saveToUserVocabulary(socket.user.id, result, languageCode);
    
  } catch (error) {
    console.error('Error creating element:', error);
    socket.emit('message_response', {
      type: 'create-element',
      success: false,
      message: 'Failed to create element',
      error: error.message,
      data: null
    });
  }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.user.name} (${socket.userId})`);
  
  // Store connected user
  connectedUsers[socket.id] = {
    userId: socket.userId,
    user: socket.user,
    roomId: null
  };

  // Handle user joining a room
  socket.on('join_room', (data) => {
    const { roomId, roomName, roomDescription, language } = data;
    
    try {
      if (rooms[roomId].gameStatus !== "waiting"){
        throw new Error("Room is not waiting for players");
      }
      // Leave current room if in one
      if (connectedUsers[socket.id].roomId) {
        socket.leave(connectedUsers[socket.id].roomId);
        
        // Remove user from previous room's player list
        const prevRoomId = connectedUsers[socket.id].roomId;
        if (rooms[prevRoomId]) {
          removePlayerFromRoom(socket.userId, prevRoomId);
          
          // Notify other players in the previous room
          socket.to(prevRoomId).emit('player_left', {
            userId: socket.userId,
            userName: socket.user.name,
            playersCount: Object.keys(rooms[prevRoomId].players).length
          });
        }
      }

      // Check if room exists, throw error if not
      if (!rooms[roomId]) {
        socket.emit('room_join_error', {
          success: false,
          message: 'Room does not exist',
          error: 'Room not found'
        });
        return;
      }

      // Add user to room
      const addedSuccessfully = addPlayerToRoom(socket, roomId);

      // Join socket room
      socket.join(roomId);
      connectedUsers[socket.id].roomId = roomId;

      // Send success response to the joining user
      socket.emit('room_joined', {
        success: true,
        roomId: roomId,
        room: rooms[roomId],
        message: `Successfully joined ${rooms[roomId].name}`
      });

      // Broadcast to all players in the room (including the joining user)
      io.to(roomId).emit('message_broadcast', {
        type: 'player_joined',
        data: {
          userId: socket.userId,
          userName: socket.user.name,
          playersCount: Object.keys(rooms[roomId].players).length,
          message: `${socket.user.name} joined the room`
        }
      });

      console.log(`👥 User ${socket.user.name} joined room ${roomId}`);
      
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('room_join_error', {
        success: false,
        message: 'Failed to join room',
        error: error.message
      });
    }
  });

  // Handle creating a new room
  socket.on('create_room', (data) => {
    const { roomId, roomName, roomDescription, language } = data;
    
    try {
      // Leave current room if in one
      if (connectedUsers[socket.id].roomId) {
        socket.leave(connectedUsers[socket.id].roomId);
        
        // Remove user from previous room's player list
        const prevRoomId = connectedUsers[socket.id].roomId;
        if (rooms[prevRoomId]) {
          removePlayerFromRoom(socket.userId, prevRoomId);
          
          // Notify other players in the previous room
          socket.to(prevRoomId).emit('player_left', {
            userId: socket.userId,
            userName: socket.user.name,
            playersCount: Object.keys(rooms[prevRoomId].players).length
          });
        }
      }

      // Check if room already exists
      if (rooms[roomId]) {
        socket.emit('room_create_error', {
          success: false,
          message: 'Room already exists',
          error: 'Room ID already taken'
        });
        return;
      }

      // Create new room
      const newRoom = createNewRoom(roomId, roomName, roomDescription, socket, language);

      // Add creator to room as leader
      addPlayerToRoom(socket, roomId);

      // Join socket room
      socket.join(roomId);
      connectedUsers[socket.id].roomId = roomId;

      // Send success response to the creator
      socket.emit('room_created', {
        success: true,
        roomId: roomId,
        room: newRoom,
        message: `Successfully created and joined ${newRoom.name}`,
        isLeader: true
      });

      console.log(`🎯 User ${socket.user.name} created and joined room ${roomId}`);
      
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('room_create_error', {
        success: false,
        message: 'Failed to create room',
        error: error.message
      });
    }
  });

  // Handle user leaving a room
  socket.on('leave_room', () => {
    try {
      const userInfo = connectedUsers[socket.id];
      if (userInfo && userInfo.roomId) {
        const roomId = userInfo.roomId;
        
        // Leave socket room
        socket.leave(roomId);
        
        // Remove user from room's player list
        if (rooms[roomId]) {
          removePlayerFromRoom(socket.userId, roomId);
          
          // Notify other players in the room
          socket.to(roomId).emit('player_left', {
            userId: socket.userId,
            userName: socket.user.name,
            playersCount: Object.keys(rooms[roomId].players).length
          });
          
          console.log(`👥 User ${socket.user.name} left room ${roomId}`);
        }
        
        // Clear user's room association
        connectedUsers[socket.id].roomId = null;
        
        // Send confirmation to the leaving user
        socket.emit('room_left', {
          success: true,
          message: 'Successfully left the room'
        });
      } else {
        socket.emit('room_left', {
          success: false,
          message: 'You are not in a room'
        });
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      socket.emit('room_left', {
        success: false,
        message: 'Failed to leave room',
        error: error.message
      });
    }
  });

  // Handle incoming messages
  socket.on('message', async (messageData) => {
    try {
      const { type, data } = messageData;
      
      if (!type) {
        socket.emit('message_error', {
          success: false,
          message: 'Message type is required',
          originalMessage: messageData
        });
        return;
      }

      console.log(`📨 Message from ${socket.user.name}: ${type}`, data);

      switch (type) {
        case 'create-element':
          await handleCreateElement(socket, data);
          break;
        
        case 'start-game':
          handleStartGame(socket, data);
          break;
        
        default:
          socket.emit('message_error', {
            success: false,
            message: `Unknown message type: ${type}`,
            originalMessage: messageData
          });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('message_error', {
        success: false,
        message: 'Failed to process message',
        error: error.message,
        originalMessage: messageData
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.user.name} (${socket.userId})`);
    
    const userInfo = connectedUsers[socket.id];
    if (userInfo && userInfo.roomId) {
      const roomId = userInfo.roomId;
      
      // Remove user from room
      if (rooms[roomId]) {
        removePlayerFromRoom(socket.userId, roomId);
        
        // Notify other players
        socket.to(roomId).emit('player_left', {
          userId: socket.userId,
          userName: socket.user.name,
          playersCount: Object.keys(rooms[roomId].players).length
        });
      }
    }
    
    // Remove from connected users
    delete connectedUsers[socket.id];
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Basic health check route
app.get('/', (req, res) => {
  res.send('BigRedHacks 2025 Backend Server');
});

app.post('/create-element', async (req, res) => {
  const { element1, element2 } = req.body;
  const result = await create_element(element1, element2);
  res.json({ element: result.element, emoji: result.emoji });
});

// Create user route
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        gamesWon: user.gamesWon || 0,
        gamesPlayed: user.gamesPlayed || 0,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        gamesWon: user.gamesWon || 0,
        gamesPlayed: user.gamesPlayed || 0,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pronunciation analysis endpoint
app.post('/api/analyze-pronunciation', async (req, res) => {
  try {
    const { groundTruthAudio, userAudio, expectedText, language = 'en', context = 'practice' } = req.body;
    
    // Validate required fields
    if (!groundTruthAudio || !userAudio || !expectedText) {
      return res.status(400).json({ 
        error: 'Missing required fields: groundTruthAudio, userAudio, expectedText' 
      });
    }
    
    console.log(`Analyzing pronunciation for: "${expectedText}" (language: ${language}, context: ${context})`);
    console.log(`Ground truth audio length: ${groundTruthAudio.length} chars`);
    console.log(`User audio length: ${userAudio.length} chars`);
    
    // Perform pronunciation analysis with language support
    const result = await analyzePronunciation(groundTruthAudio, userAudio, expectedText, language, context);
    
    // Return analysis results
    res.json({
      success: true,
      transcription: result.transcription,
      confidence: result.confidence,
      features: result.features,
      is_correct: result.is_correct,
      context: result.context,
      language: language,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Pronunciation analysis error:', error);
    res.status(500).json({ 
      error: 'Pronunciation analysis failed',
      details: error.message
    });
  }
});

// Delete user route (requires authentication)
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user.userId;

    // Check if user is trying to delete their own account
    if (userId !== requestingUserId) {
      return res.status(403).json({ error: 'You can only delete your own account' });
    }

    // Find and delete user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route example - get current user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get initial elements for a specific language
app.get('/api/elements/initial/:languageCode', (req, res) => {
  try {
    const languageCode = req.params.languageCode || 'en-US';
    const initialElements = getInitialElements(languageCode);
    res.json({ 
      elements: initialElements,
      language: languageCode 
    });
  } catch (error) {
    console.error('Error fetching initial elements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get initial elements with default language
app.get('/api/elements/initial', (req, res) => {
  try {
    const languageCode = 'en-US';
    const initialElements = getInitialElements(languageCode);
    res.json({ 
      elements: initialElements,
      language: languageCode 
    });
  } catch (error) {
    console.error('Error fetching initial elements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get initial elements audio for a specific language
app.get('/api/elements/initial-audio/:languageCode', async (req, res) => {
  try {
    const languageCode = req.params.languageCode || 'en-US';
    
    const audioEntries = await InitialElementsAudio.find({ languageCode });
    
    // Convert to simple object map
    const audioMap = {};
    audioEntries.forEach(entry => {
      if (entry.audio_b64) {
        audioMap[entry.elementKey] = entry.audio_b64;
      }
    });
    
    res.json({ 
      language: languageCode,
      audio: audioMap 
    });
  } catch (error) {
    console.error('Error fetching initial elements audio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check room validity endpoint
app.get('/api/rooms/:roomId/check', (req, res) => {
  try {
    const roomId = req.params.roomId;
    
    if (!roomId) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Room ID is required' 
      });
    }

    const room = rooms[roomId];
    
    if (!room) {
      return res.json({ 
        valid: false, 
        message: 'Room does not exist' 
      });
    }

    if (room.gameStatus !== 'waiting') {
      return res.json({ 
        valid: false, 
        message: 'Room is not waiting for players' 
      });
    }

    res.json({ 
      valid: true, 
      message: 'Room is available to join',
      room: {
        name: room.name,
        gameStatus: room.gameStatus,
        playerCount: Object.keys(room.players).length,
        language: room.language,
        createdBy: room.createdBy.userName
      }
    });
  } catch (error) {
    console.error('Error checking room validity:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'Internal server error' 
    });
  }
});

// Get user's learned vocabulary for a specific language
app.get('/api/users/:userId/vocabulary/:languageCode', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const languageCode = req.params.languageCode;

    // Verify user is accessing their own vocabulary or is admin
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to access this user\'s vocabulary' });
    }

    const user = await User.findById(userId).select('learnedVocabulary');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const vocabulary = user.learnedVocabulary?.get(languageCode) || [];
    
    res.json({
      languageCode,
      vocabulary,
      count: vocabulary.length
    });

  } catch (error) {
    console.error('Error fetching user vocabulary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's game history
app.get('/api/users/:userId/games', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify user is accessing their own games or is admin
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to access this user\'s games' });
    }

    // Find games where the user participated
    const games = await Game.find({
      'players.userId': userId
    })
    .sort({ createdAt: -1 }) // Most recent first
    .skip(skip)
    .limit(limit)
    .populate('players.userId', 'name')
    .populate('winner.userId', 'name');

    // Get total count for pagination
    const totalGames = await Game.countDocuments({
      'players.userId': userId
    });

    // Format the response
    const formattedGames = games.map(game => ({
      id: game._id,
      targetElement: game.targetElement,
      roomName: game.roomName,
      language: game.language,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      duration: game.duration,
      createdAt: game.createdAt,
      winner: game.winner ? {
        userId: game.winner.userId,
        userName: game.winner.userName
      } : null,
      players: game.players.map(player => ({
        userId: player.userId,
        userName: player.userName,
        score: player.score,
        elementsDiscovered: player.elementsDiscovered
      })),
      // Add user-specific information
      userWon: game.winner ? game.winner.userId.toString() === userId : false,
      userStats: game.players.find(p => p.userId._id ? p.userId._id.toString() === userId : p.userId.toString() === userId)
    }));

    res.json({
      games: formattedGames,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalGames / limit),
        totalGames: totalGames,
        hasNextPage: page * limit < totalGames,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching user games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific game details
app.get('/api/games/:gameId', authenticateToken, async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const userId = req.user.userId;

    const game = await Game.findById(gameId)
      .populate('players.userId', 'name')
      .populate('winner.userId', 'name');

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Check if user participated in this game
    const userParticipated = game.players.some(player => 
      player.userId._id.toString() === userId
    );
    console.log(JSON.stringify(game.players[0]));
    console.log( userId);
    console.log(userParticipated);
    if (!userParticipated) {
      return res.status(403).json({ error: 'Unauthorized to view this game' });
    }

    // Format detailed game response
    const formattedGame = {
      id: game._id,
      targetElement: game.targetElement,
      roomName: game.roomName,
      language: game.language,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      duration: game.duration,
      createdAt: game.createdAt,
      winner: game.winner ? {
        userId: game.winner.userId,
        userName: game.winner.userName
      } : null,
      players: game.players.map(player => ({
        userId: player.userId,
        userName: player.userName,
        score: player.score,
        elementsDiscovered: player.elementsDiscovered
      })),
      // Add user-specific information
      userWon: game.winner ? game.winner.userId.toString() === userId : false,
      userStats: game.players.find(p => p.userId._id ? p.userId._id.toString() === userId : p.userId.toString() === userId)
    };

    res.json(formattedGame);

  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Node.js server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access server at: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO server ready`);
  console.log(`🎙️ Voice service should be running on http://localhost:7758`);
});

module.exports = { app, server, io };
