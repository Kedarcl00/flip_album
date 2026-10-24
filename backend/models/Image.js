const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema(
    {
        albumId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Album",
            index: true
        },
        albumSlug: {
            type: String,
            index: true
        },
        imageUrl: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        caption: {
            type: String,
            default: "",
            trim: true
        },
        order: {
            type: Number,
            default: 0
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Image", ImageSchema);
