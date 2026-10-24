const mongoose = require("mongoose");

const AlbumSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Album name is required"],
            trim: true
        },
        slug: {
            type: String,
            required: [true, "Album slug is required"],
            unique: true,
            lowercase: true,
            trim: true
        },
        title: {
            type: String,
            default: "",
            trim: true
        },
        subtitle: {
            type: String,
            default: "",
            trim: true
        },
        description: {
            type: String,
            default: "",
            trim: true
        },
        coverImageUrl: {
            type: String,
            default: ""
        },
        theme: {
            backgroundType: {
                type: String,
                enum: ["image", "color", "gradient"],
                default: "gradient"
            },
            backgroundColor: {
                type: String,
                default: "#0f172a"
            },
            backgroundGradient: {
                type: String,
                default: "linear-gradient(135deg, #0f172a, #1e293b, #111827)"
            },
            backgroundImage: {
                type: String,
                default: ""
            },
            primaryColor: {
                type: String,
                default: "#ff4757"
            },
            fontFamily: {
                type: String,
                default: "'Poppins', sans-serif"
            },
            loaderText: {
                type: String,
                default: "Loading Memories..."
            }
        },
        status: {
            type: String,
            enum: ["active", "draft", "archived"],
            default: "active"
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Album", AlbumSchema);
