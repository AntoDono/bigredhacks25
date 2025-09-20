const mongoose = require("mongoose");
require('dotenv').config();
mongoose.connect(process.env.DBURL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ Connection error:", err));

module.exports = mongoose;