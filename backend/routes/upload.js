const express = require("express");

const router = express.Router();

const multer = require("multer");

const cloudinary =
require("cloudinary").v2;

const {
CloudinaryStorage
} = require("multer-storage-cloudinary");

const Image =
require("../models/Image");

require("dotenv").config();

/* CLOUDINARY CONFIG */

cloudinary.config({

    cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

    api_key:
    process.env.CLOUDINARY_API_KEY,

    api_secret:
    process.env.CLOUDINARY_API_SECRET

});

/* STORAGE */

const storage =
new CloudinaryStorage({

    cloudinary:cloudinary,

    params:{

        folder:"flipbook-images",

        allowed_formats:[
            "jpg",
            "png",
            "jpeg",
            "webp"
        ]

    }

});

/* MULTER */

const upload =
multer({ storage });

/* =========================
   UPLOAD ROUTE
========================= */

router.post(
"/upload",

upload.single("image"),

async(req,res)=>{

    try{

        const newImage =
        new Image({

            imageUrl:req.file.path,

            publicId:req.file.filename,

            albumName:req.body.albumName

        });

        await newImage.save();

        res.json({

            success:true,

            image:newImage

        });

    }catch(error){

        console.log(error);

    }

});

/* =========================
   FETCH IMAGES
========================= */

router.get(
"/images",

async(req,res)=>{

    try{

        const images =
        await Image.find();

        res.json(images);

    }catch(error){

        console.log(error);

        res.status(500).json({
            error:"Failed"
        });

    }

});

module.exports = router;

/* =========================
   DELETE IMAGE
========================= */

router.delete(

"/delete/:id",

async(req,res)=>{

   try{

      // Find image
      const image =
      await Image.findById(
         req.params.id
      );

      if(!image){

         return res.status(404).json({

            error:"Image not found"

         });

      }

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(

         image.publicId

      );

      // Delete from MongoDB
      await Image.findByIdAndDelete(

         req.params.id

      );

      res.json({

         success:true,

         message:"Image deleted"

      });

   }

   catch(error){

      console.log(error);

      res.status(500).json({

         error:"Delete failed"

      });

   }

});