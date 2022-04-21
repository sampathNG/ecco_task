const express = require('express');
const router =express.Router();
const bcrypt = require('bcrypt');
const mongoose = require("mongoose")
const crypto = require("crypto")
const multer = require("multer")
const path = require("path")
const {GridFsStorage} = require("multer-gridfs-storage")
const Grid = require("gridfs-stream")


const {generatteToken,authenticateToken} = require('../middleware/jwt')

const users = require("../db/db_model");


// USER SIGNUP
router.post("/signup",async(req,res)=>{
    try {
    const pass = await bcrypt.hash(req.body.password, 10);
    const userr = new users({
    name:req.body.name,
    password:pass,
    email:req.body.email,
    phone:req.body.phone,
    })
    const data = await users.insertMany(userr);
    console.log("signup successful")
    res.send("signup successful")
    } catch (error) {
        console.log(error)
        res.send(error.message)
    }
})

// USER LOGIN
router.post("/login",async(req,res)=>{
    try {
        const userdata = await users.findOne({email:req.body.email})
        if(userdata){
            const compare = await bcrypt.compareSync(req.body.password,userdata.password)
            if(compare){
                const token = generatteToken(req.body)
                res.send(token)
                console.log("login succesfull",token)
            }else{
                console.log("wrong password entered")
                res.send("wrong password entered")
            }
        }else{
            res.send("user not found")
            console.log("user not found")
        }
    } catch (error) {
        console.log(error)
        res.send(error.message)
    }
})

// IMAGE UPLOAD

const mongoURI = "mongodb://localhost/eco_task"
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname)
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
const upload = multer({ storage });

// uploading images
router.post("/",authenticateToken,upload.single("img"),(req,res)=>{
    res.json({file:req.file})
})


// getting images
router.get('/image',authenticateToken,(req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files),console.log(files)
  });
});

// get single image

router.get('/files/:filename',authenticateToken, (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    return res.json(file),console.log(file);
  });
});

// displaying image after retreiving it from database

router.get('/image/:filename',authenticateToken, (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    if (file.contentType === 'image/jpg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

// USER LOGOUT

router.post('/logout', authenticateToken, async (req, res) => {
    try {
        req.userr.tokens = req.userr.tokens.filter((token) =>{
         return token.token !== req.token
        })
        await req.userr.save()
        console.log("logged out succesfully")
        res.send("logged out succesfully")
    } catch (error) {
        res.status(500).send()
    }
})


module.exports = router;