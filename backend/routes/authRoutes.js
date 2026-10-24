const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const auth = require("../middleware/auth");

const router = express.Router();

/* =========================================================
   LOGIN ROUTE (Email + Password, with backward-compat fallback)
========================================================= */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        let adminUser = null;

        // If email provided, find by email
        if (email) {
            adminUser = await Admin.findOne({ email: email.toLowerCase().trim() });
            if (!adminUser) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            const isMatch = await adminUser.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }
        } else {
            // Backward-compatibility: if only password was sent
            adminUser = await Admin.findOne();
            let isValid = false;

            if (adminUser) {
                isValid = await adminUser.comparePassword(password);
            }

            // Fallback check against process.env.ADMIN_PASSWORD
            if (!isValid && process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
                isValid = true;
            }

            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid password"
                });
            }
        }

        // Generate JWT Token
        const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret_flip_album";
        const payload = {
            id: adminUser ? adminUser._id : "admin",
            email: adminUser ? adminUser.email : (process.env.ADMIN_EMAIL || "admin@flipalbum.com"),
            name: adminUser ? adminUser.name : "Administrator",
            admin: true
        };

        const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: payload.id,
                email: payload.email,
                name: payload.name
            }
        });
    } catch (error) {
        console.error("Login route error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during login"
        });
    }
});

/* =========================================================
   GET CURRENT ADMIN PROFILE (Protected)
========================================================= */
router.get("/me", auth, async (req, res) => {
    try {
        let admin = null;
        if (req.user.id !== "admin") {
            admin = await Admin.findById(req.user.id).select("-password");
        }

        return res.json({
            success: true,
            user: admin || {
                email: req.user.email,
                name: req.user.name,
                admin: true
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve admin details"
        });
    }
});

/* =========================================================
   LOGOUT ROUTE
========================================================= */
router.post("/logout", (req, res) => {
    return res.json({
        success: true,
        message: "Logged out successfully"
    });
});

module.exports = router;
