const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { create_element } = require('./llm');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Basic health check route
app.get('/', (req, res) => {
  res.send('BigRedHacks 2025 Backend Server');
});

app.post('/create-element', async (req, res) => {
  const { element1, element2 } = req.body;
  const newElement = await create_element(element1, element2);
  res.json({ element: newElement.element });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access server at: http://localhost:${PORT}`);
});

module.exports = app;
