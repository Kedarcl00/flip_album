const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Image = require("../models/Image");
require("dotenv").config();

/* CLOUDINARY CONFIG */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/* STORAGE */
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "flipbook-images",
        allowed_formats: [
            "jpg",
            "png",
            "jpeg",
            "webp"
        ]
    }
});

/* MULTER */
const upload = multer({ storage });

/* =========================
   UPLOAD ROUTE
========================= */
router.post(
    "/upload",
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: "No image file provided"
                });
            }

            const newImage = new Image({
                imageUrl: req.file.path,
                publicId: req.file.filename,
                order: req.body.order !== undefined ? Number(req.body.order) : 0
            });

            await newImage.save();

            res.json({
                success: true,
                image: newImage
            });
        } catch (error) {
            console.error("Upload error:", error);
            res.status(500).json({
                success: false,
                error: "Image upload failed"
            });
        }
    }
);

/* =========================
   FETCH IMAGES
========================= */
router.get("/images", async (req, res) => {
    try {
        const images = await Image.find().sort({ order: 1, createdAt: 1 });
        res.json(images);
    } catch (error) {
        console.error("Fetch images error:", error);
        res.status(500).json({
            error: "Failed to fetch images"
        });
    }
});

/* =========================
   DELETE IMAGE
========================= */
router.delete("/delete/:id", async (req, res) => {
    try {
        // Find image
        const image = await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).json({
                error: "Image not found"
            });
        }

        // Delete from Cloudinary
        if (image.publicId) {
            await cloudinary.uploader.destroy(image.publicId);
        }

        // Delete from MongoDB
        await Image.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Image deleted"
        });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({
            error: "Delete failed"
        });
    }
});

module.exports = router;
