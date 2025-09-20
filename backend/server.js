const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const { create_element } = require('./llm');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('./db'); // Connect to database
const { User, InitialElementsAudio } = require('./schema');
const { getInitialElements } = require('./languages');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Configure this properly in production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8000;
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
    'steam',
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
        "endedAt": Date    // When game ended
    }
}
*/

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

const checkForGameEnd = (socket, roomId, createdElementData) => {
  const room = rooms[roomId];
  if (!room || room.gameStatus === 'ended') return false;
  
  // Check if created element matches target (using English text for comparison)
  const createdElementEnglish = createdElementData.en_text || createdElementData.element;
  if (createdElementEnglish.toLowerCase() === room.target_element.toLowerCase()) {
    // End the game
    room.gameStatus = 'ended';
    room.winner = socket.userId;
    room.endedAt = new Date();
    
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
    
    console.log(`🏆 Game ended! ${socket.user.name} won room ${roomId} by creating ${createdElemenEnglish}`);
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
    
    console.log(`🎮 Game started in room ${roomId} by ${socket.user.name}`);
    
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
      gameEnded = checkForGameEnd(socket, roomId, result);
    }
    
    console.log(`✨ Element created: ${newElement} by ${socket.user.name}`);
    
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

      // Create room if it doesn't exist
      if (!rooms[roomId]) {
        createNewRoom(roomId, roomName, roomDescription, socket, language);
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
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
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

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access server at: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO server ready`);
});

module.exports = { app, server, io };
