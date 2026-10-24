const express = require("express");
const mongoose = require("mongoose");
const qrcode = require("qrcode");
const cloudinary = require("cloudinary").v2;
const Album = require("../models/Album");
const Image = require("../models/Image");
const auth = require("../middleware/auth");

const router = express.Router();

// Helper to slugify a string
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// Helper to determine Frontend URL for QR codes
function getFrontendUrl(req) {
    if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL.replace(/\/+$/, "");
    }
    const origin = req.headers.origin || req.headers.referer;
    if (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        try {
            const urlObj = new URL(origin);
            return urlObj.origin;
        } catch (e) {}
    }
    return "https://flip-album.vercel.app";
}

/* =========================================================
   1. GET ALL ALBUMS (Protected)
========================================================= */
router.get("/", auth, async (req, res) => {
    try {
        const albums = await Album.find().sort({ createdAt: -1 }).lean();

        // Attach image counts and cover image
        const albumIds = albums.map((a) => a._id);
        const imageCounts = await Image.aggregate([
            { $match: { albumId: { $in: albumIds } } },
            { $group: { _id: "$albumId", count: { $sum: 1 }, firstImage: { $first: "$imageUrl" } } }
        ]);

        const countMap = {};
        imageCounts.forEach((item) => {
            countMap[item._id.toString()] = {
                count: item.count,
                firstImage: item.firstImage
            };
        });

        const enhancedAlbums = albums.map((alb) => {
            const stats = countMap[alb._id.toString()] || { count: 0, firstImage: "" };
            return {
                ...alb,
                photoCount: stats.count,
                coverImageUrl: alb.coverImageUrl || stats.firstImage || ""
            };
        });

        return res.json({
            success: true,
            count: enhancedAlbums.length,
            albums: enhancedAlbums
        });
    } catch (error) {
        console.error("List albums error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve albums"
        });
    }
});

/* =========================================================
   2. CREATE NEW ALBUM (Protected)
========================================================= */
router.post("/", auth, async (req, res) => {
    try {
        let { name, slug, title, subtitle, description, theme, coverImageUrl, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Album name is required"
            });
        }

        // Generate slug if not provided
        slug = slug ? slugify(slug) : slugify(name);

        if (!slug) {
            slug = `album-${Date.now()}`;
        }

        // Check for duplicate slug
        const existing = await Album.findOne({ slug });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `An album with the URL identifier "${slug}" already exists. Please choose a different slug.`
            });
        }

        const newAlbum = new Album({
            name: name.trim(),
            slug,
            title: title ? title.trim() : name.trim(),
            subtitle: subtitle ? subtitle.trim() : "",
            description: description ? description.trim() : "",
            coverImageUrl: coverImageUrl || "",
            status: status || "active",
            theme: {
                backgroundType: theme?.backgroundType || "gradient",
                backgroundColor: theme?.backgroundColor || "#0f172a",
                backgroundGradient: theme?.backgroundGradient || "linear-gradient(135deg, #0f172a, #1e293b, #111827)",
                backgroundImage: theme?.backgroundImage || "",
                primaryColor: theme?.primaryColor || "#ff4757",
                fontFamily: theme?.fontFamily || "'Poppins', sans-serif",
                loaderText: theme?.loaderText || "Loading Memories..."
            }
        });

        await newAlbum.save();

        return res.status(201).json({
            success: true,
            message: "Album created successfully",
            album: newAlbum
        });
    } catch (error) {
        console.error("Create album error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create album"
        });
    }
});

/* =========================================================
   3. GET SINGLE ALBUM BY ID OR SLUG (Public)
========================================================= */
router.get("/:idOrSlug", async (req, res) => {
    try {
        const { idOrSlug } = req.params;

        let query = { slug: idOrSlug.toLowerCase() };
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            query = { $or: [{ _id: idOrSlug }, { slug: idOrSlug.toLowerCase() }] };
        }

        let album = await Album.findOne(query).lean();

        // If not found and querying default / tirtha fallback
        if (!album && (idOrSlug === "default" || idOrSlug === "tirtha-turns-one")) {
            album = await Album.findOne({ isDefault: true }).lean();
        }

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            });
        }

        const photoCount = await Image.countDocuments({ albumId: album._id });

        return res.json({
            success: true,
            album: {
                ...album,
                photoCount
            }
        });
    } catch (error) {
        console.error("Get album error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve album"
        });
    }
});

/* =========================================================
   4. UPDATE ALBUM (Protected)
========================================================= */
router.put("/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, title, subtitle, description, theme, coverImageUrl, status } = req.body;

        const album = await Album.findById(id);
        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            });
        }

        if (name) album.name = name.trim();
        if (title !== undefined) album.title = title.trim();
        if (subtitle !== undefined) album.subtitle = subtitle.trim();
        if (description !== undefined) album.description = description.trim();
        if (coverImageUrl !== undefined) album.coverImageUrl = coverImageUrl;
        if (status) album.status = status;

        if (slug) {
            const formattedSlug = slugify(slug);
            if (formattedSlug !== album.slug) {
                // Check if another album has this slug
                const duplicate = await Album.findOne({ slug: formattedSlug, _id: { $ne: album._id } });
                if (duplicate) {
                    return res.status(400).json({
                        success: false,
                        message: `The slug "${formattedSlug}" is already in use by another album.`
                    });
                }
                album.slug = formattedSlug;
                // Sync image albumSlug
                await Image.updateMany({ albumId: album._id }, { $set: { albumSlug: formattedSlug } });
            }
        }

        if (theme) {
            album.theme = {
                ...album.theme.toObject(),
                ...theme
            };
        }

        await album.save();

        return res.json({
            success: true,
            message: "Album updated successfully",
            album
        });
    } catch (error) {
        console.error("Update album error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update album"
        });
    }
});

/* =========================================================
   5. DELETE ALBUM (Protected)
========================================================= */
router.delete("/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        const album = await Album.findById(id);
        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            });
        }

        // Safety: protect default album from accidental deletion
        if (album.isDefault && req.query.force !== "true") {
            return res.status(400).json({
                success: false,
                message: "The default Tirtha album is protected from accidental deletion."
            });
        }

        // Find all images belonging to this album
        const images = await Image.find({ albumId: album._id });

        // Clean up Cloudinary assets
        for (const img of images) {
            if (img.publicId) {
                try {
                    await cloudinary.uploader.destroy(img.publicId);
                } catch (cErr) {
                    console.warn(`Failed to delete Cloudinary asset ${img.publicId}:`, cErr.message);
                }
            }
        }

        // Delete all images in database
        await Image.deleteMany({ albumId: album._id });

        // Delete album
        await Album.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: `Album "${album.name}" and ${images.length} photos deleted successfully.`
        });
    } catch (error) {
        console.error("Delete album error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete album"
        });
    }
});

/* =========================================================
   6. GET ALBUM QR CODE (Public)
========================================================= */
router.get("/:idOrSlug/qr", async (req, res) => {
    try {
        const { idOrSlug } = req.params;

        let query = { slug: idOrSlug.toLowerCase() };
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            query = { $or: [{ _id: idOrSlug }, { slug: idOrSlug.toLowerCase() }] };
        }

        const album = await Album.findOne(query);
        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            });
        }

        const baseUrl = getFrontendUrl(req);
        // Public album URL format
        const publicUrl = `${baseUrl}/album/${album.slug}`;

        // Generate QR code data URL
        const qrCodeDataUrl = await qrcode.toDataURL(publicUrl, {
            width: 450,
            margin: 2,
            color: {
                dark: "#0f172a",
                light: "#ffffff"
            }
        });

        return res.json({
            success: true,
            publicUrl,
            qrCodeDataUrl,
            album: {
                id: album._id,
                name: album.name,
                slug: album.slug
            }
        });
    } catch (error) {
        console.error("Generate QR code error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate QR code"
        });
    }
});

/* =========================================================
   7. GET ALBUM IMAGES (Public)
========================================================= */
router.get("/:idOrSlug/images", async (req, res) => {
    try {
        const { idOrSlug } = req.params;

        let query = { slug: idOrSlug.toLowerCase() };
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            query = { $or: [{ _id: idOrSlug }, { slug: idOrSlug.toLowerCase() }] };
        }

        let album = await Album.findOne(query);

        // Fallback for default
        if (!album && (idOrSlug === "default" || idOrSlug === "tirtha-turns-one")) {
            album = await Album.findOne({ isDefault: true });
        }

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            });
        }

        const images = await Image.find({ albumId: album._id }).sort({ order: 1, createdAt: 1 });

        return res.json(images);
    } catch (error) {
        console.error("Fetch album images error:", error);
        return res.status(500).json({
            error: "Failed to fetch album images"
        });
    }
});

module.exports = router;
