const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required: No token provided"
        });
    }

    // Support "Bearer <token>" format
    if (token.startsWith("Bearer ")) {
        token = token.slice(7).trim();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret_flip_album");
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed: Token is invalid or expired"
        });
    }
};

module.exports = auth;
