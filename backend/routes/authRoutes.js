const express = require("express");

const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/login", (req, res) => {

    try{

        console.log("BODY =>", req.body);

        const password = req.body.password;

        console.log("PASSWORD =>", password);

        console.log("ENV PASSWORD =>", process.env.ADMIN_PASSWORD);

        if(password === process.env.ADMIN_PASSWORD){

            const token = jwt.sign(

                { admin:true },

                process.env.JWT_SECRET,

                { expiresIn:"1d" }

            );

            console.log("TOKEN CREATED");

            return res.json({
                success:true,
                token
            });

        }else{

            return res.status(401).json({
                success:false,
                message:"Wrong Password"
            });

        }

    }catch(error){

        console.log("LOGIN ERROR =>", error);

        return res.status(500).json({
            success:false,
            message:"Server Error"
        });

    }

});

module.exports = router;