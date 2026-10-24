require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const albumRoutes = require("./routes/albumRoutes");
const uploadRoutes = require("./routes/upload");
const auth = require("./middleware/auth");
const initDb = require("./utils/initDb");

const app = express();

/* =========================
   MIDDLEWARE & CORS
========================= */
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   HEALTH CHECK / ROOT
========================= */
app.get("/", (req, res) => {
    res.send("Multi-Album QR Flip Album Backend is running");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "flip-album-api",
        timestamp: new Date().toISOString()
    });
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api", uploadRoutes);

/* =========================
   PROTECTED ROUTE (Legacy check)
========================= */
app.get("/api/admin", auth, (req, res) => {
    res.json({
        success: true,
        message: "Welcome Admin",
        user: req.user
    });
});

/* =========================
   MONGODB CONNECTION
========================= */
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("WARNING: MONGO_URI environment variable is not defined in environment variables!");
} else {
    // Warn if connection string has unencoded '@' in password
    const atCount = (MONGO_URI.match(/@/g) || []).length;
    if (atCount > 1) {
        console.warn("WARNING: MONGO_URI contains multiple '@' characters. If your MongoDB password contains an '@', you MUST URL-encode it as '%40' in your connection string!");
    }

    mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000
    })
        .then(async () => {
            console.log("MongoDB Connected successfully");
            // Run automatic backward-compatible database migration and seed
            await initDb();
        })
        .catch((error) => {
            console.error("MongoDB Connection Error:", error.message);
            if (error.message.includes("bad auth")) {
                console.error("-> Authentication failed: Check your MongoDB Atlas Database Username and Password. If your password has special characters like '@', ensure they are URL-encoded (e.g. '@' -> '%40').");
            }
        });
}

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
});
