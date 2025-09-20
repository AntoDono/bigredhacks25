const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/mydb")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ Connection error:", err));

module.exports = mongoose;