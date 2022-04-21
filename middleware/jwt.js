require("dotenv").config()
const jwt = require("jsonwebtoken")

function generatteToken(userData){
    const token =jwt.sign({userData},"sampath kumar")
    return token
}

function authenticateToken(req,res,next){
    try{
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if (token == null) return res.sendStatus(401)
        jwt.verify(token,"sampath kumar",(err)=>{
        if(err){
            console.log({err:err.meassage})
            res.send(err)
        }
        // req.data = data

        next()
    })
    }
    catch(err){
        console.log(err)
    }
}

module.exports = {generatteToken,authenticateToken}

// console.log(process.env.secret)
