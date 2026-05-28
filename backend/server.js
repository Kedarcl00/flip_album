require("dotenv").config();

const express = require("express");

const cors = require("cors");


const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const auth = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);


console.log(process.env.JWT_SECRET);

console.log(process.env.ADMIN_PASSWORD);
/* =========================
   PROTECTED ROUTE
========================= */

app.get("/api/admin", auth, (req, res) => {

    res.json({
        success:true,
        message:"Welcome Admin"
    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Server Running On Port ${PORT}`
    );

});

/* CLOUDINARY */

const cloudinary =
require("cloudinary").v2;

/* ROUTE FILE */

const uploadRoutes =
require("./routes/upload");



/* =========================
   CLOUDINARY CONFIG
========================= */

cloudinary.config({

    cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

    api_key:
    process.env.CLOUDINARY_API_KEY,

    api_secret:
    process.env.CLOUDINARY_API_SECRET

});

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());

/* =========================
   ROUTES
========================= */

app.use("/api", uploadRoutes);

/* =========================
   MONGODB CONNECTION
========================= */

mongoose.connect(process.env.MONGO_URI)

.then(()=>{

    console.log("MongoDB Connected");

})

.catch((error)=>{

    console.log(error);

});

/* =========================
   SERVER
========================= */

app.listen(3000, ()=>{

    console.log(
    "Server Running on Port 5000"
    );

});

