const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Image = require("../models/Image");
const Album = require("../models/Album");
const auth = require("../middleware/auth");
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
        allowed_formats: ["jpg", "png", "jpeg", "webp"]
    }
});

/* MULTER - 20MB limit, up to 100 images per album */
const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20 MB
    }
});

/* Helper to resolve target album */
async function resolveAlbum(albumIdOrSlug) {
    if (!albumIdOrSlug) {
        return await Album.findOne({ isDefault: true }) || await Album.findOne();
    }
    let query = { slug: albumIdOrSlug.toString().toLowerCase() };
    if (mongoose.Types.ObjectId.isValid(albumIdOrSlug)) {
        query = { $or: [{ _id: albumIdOrSlug }, { slug: albumIdOrSlug.toString().toLowerCase() }] };
    }
    return await Album.findOne(query);
}

/* =========================================================
   1. UPLOAD IMAGE (Protected)
   Backward-compatible: defaults to Tirtha album if none specified
========================================================= */
router.post(
    "/upload",
    auth,
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: "No image file provided"
                });
            }

            const targetAlbum = await resolveAlbum(req.body.albumId || req.body.albumSlug || req.body.albumName);

            const newImage = new Image({
                albumId: targetAlbum ? targetAlbum._id : undefined,
                albumSlug: targetAlbum ? targetAlbum.slug : undefined,
                imageUrl: req.file.path,
                publicId: req.file.filename,
                caption: req.body.caption || "",
                order: req.body.order !== undefined ? Number(req.body.order) : 0
            });

            await newImage.save();

            // If album has no cover image yet, set this as cover
            if (targetAlbum && !targetAlbum.coverImageUrl) {
                targetAlbum.coverImageUrl = newImage.imageUrl;
                await targetAlbum.save();
            }

            return res.json({
                success: true,
                image: newImage
            });
        } catch (error) {
            console.error("Upload error:", error);
            return res.status(500).json({
                success: false,
                error: "Image upload failed: " + error.message
            });
        }
    }
);

/* =========================================================
   2. FETCH IMAGES (Public, supports ?album=<id_or_slug>)
   Backward-compatible: returns default album images if no query
========================================================= */
router.get("/images", async (req, res) => {
    try {
        const albumParam = req.query.album || req.query.albumId || req.query.albumSlug;

        let targetAlbum = null;
        if (albumParam) {
            targetAlbum = await resolveAlbum(albumParam);
            if (!targetAlbum) {
                return res.status(404).json({ error: "Album not found" });
            }
        } else {
            // Default backward compatible behavior
            targetAlbum = await Album.findOne({ isDefault: true }) || await Album.findOne();
        }

        const query = targetAlbum ? { albumId: targetAlbum._id } : {};
        const images = await Image.find(query).sort({ order: 1, createdAt: 1 });

        return res.json(images);
    } catch (error) {
        console.error("Fetch images error:", error);
        return res.status(500).json({
            error: "Failed to fetch images"
        });
    }
});

/* =========================================================
   3. REORDER IMAGES (Protected, Bulk)
========================================================= */
router.put("/images/reorder", auth, async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, order }

        if (!Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: "Items array is required"
            });
        }

        const updatePromises = items.map((item) =>
            Image.findByIdAndUpdate(item.id, { $set: { order: Number(item.order) } })
        );

        await Promise.all(updatePromises);

        return res.json({
            success: true,
            message: "Images reordered successfully"
        });
    } catch (error) {
        console.error("Reorder images error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update image order"
        });
    }
});

/* =========================================================
   4. UPDATE SINGLE IMAGE CAPTION / ORDER (Protected)
========================================================= */
router.put("/images/:id", auth, async (req, res) => {
    try {
        const { caption, order } = req.body;
        const updateData = {};
        if (caption !== undefined) updateData.caption = caption.trim();
        if (order !== undefined) updateData.order = Number(order);

        const updatedImage = await Image.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedImage) {
            return res.status(404).json({ success: false, message: "Image not found" });
        }

        return res.json({
            success: true,
            image: updatedImage
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update image"
        });
    }
});

/* =========================================================
   5. DELETE IMAGE (Protected)
========================================================= */
async function handleDeleteImage(req, res) {
    try {
        const image = await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).json({
                error: "Image not found"
            });
        }

        // Delete from Cloudinary
        if (image.publicId) {
            try {
                await cloudinary.uploader.destroy(image.publicId);
            } catch (cErr) {
                console.warn(`Failed to destroy Cloudinary asset ${image.publicId}:`, cErr.message);
            }
        }

        // Delete from MongoDB
        await Image.findByIdAndDelete(req.params.id);

        return res.json({
            success: true,
            message: "Image deleted"
        });
    } catch (error) {
        console.error("Delete error:", error);
        return res.status(500).json({
            error: "Delete failed"
        });
    }
}

// Supported under both /delete/:id (legacy) and /images/:id (RESTful)
router.delete("/delete/:id", auth, handleDeleteImage);
router.delete("/images/:id", auth, handleDeleteImage);

module.exports = router;
