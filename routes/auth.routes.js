const {Router} = require('express')
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const {check, validationResult} = require('express-validator') 
const router = Router()

// /api/auth/register
router.post('/register',
    [
        check('email','incorrect email').isEmail(),
        check('password','min password lenght 6 characters')
            .isLength({min: 6})
    ],
    async (req, res) => {
    try{
        console.log('Body:', req.body)
        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({
                errors: errors,
                message: 'incorrect registration data'
            })
        }

        const {email, password} = req.body
        const candidate = await User.findOne({ email })

        if(candidate){
            return res.status(400).json({message: 'This user already exist'})
        }

        const hashedPassword = await bcrypt.hash(password, 12)
        const user = new User({email, password: hashedPassword})

        await user.save()

        res.status(201).json({message: 'User created'})

    }catch(e){
        res.status(500).json({message: "something wrong, please try again"})
    }
})

// /api/auth/login
router.post('/login',
[
    check('email','incorrect email').normalizeEmail().isEmail(),
    check('password','input password').exists()
],
async (req, res) => {
try{
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        return res.status(400).json({
            errors: errors,
            message: 'incorrect login data'
        })
    }

    const {email, password} = req.body

    const user = await User.findOne({email})

    if(!user){
        return res.status(400).json({message:'user not found'})
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        return res.status(400),json({message: 'incorrect password'})
    }

    const token = jwt.sign(
        {user: user.id},
        config.get('jwtSecret'),
        {expiresIn: '1h'}
    )  

    res.json({token, userId: user.id})
    
}catch(e){
    res.status(500).json({message: "something wrong, please try again"})
}
})

module.exports = router