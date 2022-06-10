const mongoose = require('mongoose')
const photoSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
        required: true,
        auto: true,
    },
    url: String,
    name: String,
    love: { type: Number, default: 0 },
})
const categoriesSchema = new mongoose.Schema({
    thumbnail: String,
    categoryName: String,
    title: String,
    description: String,
    photos: [photoSchema],

})
module.exports = mongoose.models.categories || mongoose.model("categories", categoriesSchema);