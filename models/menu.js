const mongoose = require('mongoose')
const dropSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    thumbnail: String,
    categoryName: String,
    subCategory: String,

})
const menuSchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
    },
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
        required: true,
        auto: false,
    },
    thumbnail: String,
    dropdown: [dropSchema],


})
module.exports = mongoose.models.menuSchema || mongoose.model("menuSchema", menuSchema);


