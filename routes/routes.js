const express = require('express')
const router = express.Router()
const axios = require('axios')
const {generateToken, verifyToken} = require('../middlewares/middleware')
const users = require('../data/users')
const urlBase = 'https://rickandmortyapi.com/api/character'

router.get("/",(req,res) => {
    //console.log(req.session.token);
    
    if (req.session.token) {
        res.redirect("/search")
    }else{
        const template = `
            <form action="/login" method="post">
            <label for="username">User:</label>
            <input type="text" id="username" name="username" required><br>
        
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required><br>
        
            <button type="submit">Log in</button>
          </form>
            `
        res.send(template)
    }
    
    
})

router.post("/login",(req,res) => {
    const {username,password} = req.body
    
    const findIndex = users.findIndex(user => user.userName === username && user.password === password )
    
    if (findIndex === -1) {
        res.status(404).json({message: 'user does not exist'})
    }else{
        const token = generateToken(users[findIndex]) 
        //console.log(token);
        
        req.session.token = token
        res.redirect("/search")
        
    }

    
})

router.get("/search",verifyToken,(req,res) => {
    res.send(`
        
        <form method="post" action="/search">
        <label for="inputName">Search Character</label>
        <input id="inputName" type="text" placeholder="Rick" required name="characterName" /> 
        <button type="submit">Search</button>
        </form>

        <a href="/"> <button>Log out</button> </a>

        `);
})
router.post("/search",async(req,res) => {
    const characterName = req.body.characterName.toLowerCase()
    if (req.session.token) {
        try {
            const response = await axios.get(`${urlBase}/?name=${characterName}&`)
            const characters = await response.data.results
            const allCharacters = characters.map(character => {
                const {name,gender,status,image,origin:{name: nameOrigin}} = character
                return {name,gender,status,image,origin:{name: nameOrigin}}
            })
            res.json(allCharacters)
            
        } catch (error) {
            res.status(500).json({message: "Error accessing server"})
        }
    }else{
        res.redirect("/")
    }
    
})
router.get("/characters",async(req,res) => {
    
    if (req.session.token) {
        try {
            const response = await axios.get(`${urlBase}`)
            const characters = await response.data.results
            const allCharacters = characters.map(character => {
                const {name,gender,status,image,origin:{name: nameOrigin}} = character
                return {name,gender,status,image,origin:{name: nameOrigin}}
            })
            res.json(allCharacters)
            
        } catch (error) {
            res.status(500).json({message: "Error accessing server"})
        }
    }else{
        res.redirect("/")
    }
    
})

router.get("/characters/:name",async(req,res) => {
    const characterName = req.params.name
    if (req.session.token) {
        try {
            const response = await axios.get(`${urlBase}/?name=${characterName}&`)
            const characters = await response.data.results
            const allCharacters = characters.map(character => {
                const {name,gender,status,image,origin:{name: nameOrigin},species} = character
                const template = 
                `
                <h1> <span> Name:</span> ${name} </h1>
                <img src="${image}" alt"${name}">
                <p> <span>Status:</span> ${status}</p>
                <p> <span>Species:</span> ${species}</p>
                <p> <span>Gender:</span> ${gender}</p>
                <p><span>Origin:</span> ${nameOrigin}</p>
                `
                return template
            }).join("")
            res.send(`<a href="/logout"> <button>Log out</button> </a> ${allCharacters}`)
            
        } catch (error) {
            res.status(500).json({message: "Error accessing server"})
        }
    }else{
        res.redirect("/")
    }
    
})

router.get('/logout', (req,res) => {
    req.session.destroy(); 
    res.redirect('/')
})


module.exports = router

