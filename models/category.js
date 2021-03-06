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
    categoryName: {
        type: String,
        required: true,
    },
    title: String,
    subCategory: String,
    description: String,
    photos: [String],

})
module.exports = mongoose.models.categories || mongoose.model("categories", categoriesSchema);


