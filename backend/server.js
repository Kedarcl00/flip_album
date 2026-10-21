require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/upload");
const auth = require("./middleware/auth");

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
    res.send("Flip Album Backend is running");
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);

/* =========================
   PROTECTED ROUTE
========================= */
app.get("/api/admin", auth, (req, res) => {
    res.json({
        success: true,
        message: "Welcome Admin"
    });
});

/* =========================
   MONGODB CONNECTION
========================= */
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("WARNING: MONGO_URI environment variable is not defined in environment variables!");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log("MongoDB Connected successfully");
        })
        .catch((error) => {
            console.error("MongoDB Connection Error:", error.message);
        });
}

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
});
