const mongoose = require('mongoose')
const dropSchema = new mongoose.Schema({

    thumbnail: String,
    categoryName: String,
    subCategory: String,

})
const menuSchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
    },

    thumbnail: String,
    dropdown: [dropSchema],


})
module.exports = mongoose.models.menuSchema || mongoose.model("menuSchema", menuSchema);


