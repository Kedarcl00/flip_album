const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {

    const token = req.headers.authorization;

    if(!token){

        return res.status(401).json({
            success:false,
            message:"No token found"
        });

    }

    try{

        jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        next();

    }catch(error){

        return res.status(401).json({
            success:false,
            message:"Invalid Token"
        });

    }

};

module.exports = auth;