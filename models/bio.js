const mongoose = require('mongoose')
// small schema 
const imgSchema = new mongoose.Schema({
    url: String,
    title: String,
})

const sectionSchema = new mongoose.Schema({
    title: String,
    description: String,
    url: {
        type: String,
        default: '',
    },
    img: [imgSchema],
    video: '',
})

// main schema 
const bioSchema = new mongoose.Schema({
    img: String,
    date: {
        type: Date,
        default: new Date(),

    },
    heading: String,
    description: String,
    sections: [sectionSchema],

})
module.exports = mongoose.models.bio || mongoose.model("bio", bioSchema);