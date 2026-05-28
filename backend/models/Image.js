const mongoose = require("mongoose");

const ImageSchema =
new mongoose.Schema({

    imageUrl:{
        type:String,
        required:true
    },

    publicId:{
        type:String,
        required:true
    },
    order:{
        type:Number,
        default:0
    },

    createdAt:{
        type:Date,
        default:Date.now
    }

});

module.exports =
mongoose.model("Image", ImageSchema);