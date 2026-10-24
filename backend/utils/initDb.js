const Album = require("../models/Album");
const Image = require("../models/Image");
const Admin = require("../models/Admin");

async function initDb() {
    try {
        // 1. Ensure Default Tirtha Album exists
        let defaultAlbum = await Album.findOne({
            $or: [{ slug: "tirtha-turns-one" }, { isDefault: true }]
        });

        if (!defaultAlbum) {
            defaultAlbum = await Album.create({
                name: "Tirtha Turns One!",
                slug: "tirtha-turns-one",
                title: "When Tirtha Turns One!",
                subtitle: "15 April 2026",
                description: "Tirtha's First Birthday Flip Album",
                theme: {
                    backgroundType: "image",
                    backgroundImage: "sounds/DSC_5323.JPG",
                    backgroundGradient: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7))",
                    primaryColor: "#ff4757",
                    fontFamily: "'Poppins', sans-serif",
                    loaderText: "Loading Memories..."
                },
                isDefault: true,
                status: "active"
            });
            console.log("Default Tirtha album initialized successfully.");
        }

        // 2. Backward compatibility migration for existing images
        const unassignedImages = await Image.countDocuments({
            $or: [{ albumId: { $exists: false } }, { albumId: null }]
        });

        if (unassignedImages > 0) {
            const updateResult = await Image.updateMany(
                { $or: [{ albumId: { $exists: false } }, { albumId: null }] },
                {
                    $set: {
                        albumId: defaultAlbum._id,
                        albumSlug: defaultAlbum.slug
                    }
                }
            );
            console.log(`Migrated ${updateResult.modifiedCount} legacy images to default album "${defaultAlbum.name}".`);
        }

        // 3. Ensure an Admin user exists
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const adminEmail = (process.env.ADMIN_EMAIL || "admin@flipalbum.com").toLowerCase().trim();
            const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
            const adminName = process.env.ADMIN_NAME || "Administrator";

            await Admin.create({
                email: adminEmail,
                password: adminPassword,
                name: adminName
            });
            console.log(`Admin account initialized for email: ${adminEmail}`);
        }
    } catch (error) {
        console.error("Database initialization / migration error:", error.message);
    }
}

module.exports = initDb;
