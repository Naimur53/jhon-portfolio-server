const mongoose = require('mongoose')

// main schema 
const userSchema = new mongoose.Schema({
    displayName: String,
    email: String,
    photoURL: String,
    createdAt: String,
    uid: String,

})

module.exports = mongoose.models.user || mongoose.model("user", userSchema);