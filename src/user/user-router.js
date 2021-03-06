const express = require('express')
const path = require('path')
const UserService = require('./user-service')
const { requireAuth } = require('../middleware/jwt-auth')
const FollowService = require('../follow/follow-service')
const InitPostService = require('../post/init-post-service')

const userRouter = express.Router()
const jsonBodyParser = express.json()

userRouter
    .route('/')
    .post(jsonBodyParser, registerUser)


userRouter
    .route('/')
    .get(requireAuth, getAllUsers)

userRouter
    .route('/:user_id')
    .all(requireAuth)
    .get(requireAuth, verifyUserExists, getUser)

userRouter
    .route('/user/:user_id')
    .all(requireAuth)
    .get(requireAuth, getUserInfoRoute)

async function registerUser(req, res, next) {
    try {
        const {
            fullname,
            username,
            user_password,
            email,
            about_user,
            user_stack
        } = req.body

        for (const field of ['fullname', 'username', 'user_password', 'email', 'about_user', 'user_stack'])
            if (!req.body[field])
                return res.status(400).json({
                    error: `Missing '${field}' in request body`
                })

        const usernameError = await UserService.validateUsername(username)

        if (usernameError)
            return await res.status(400).json({ error: usernameError })

        const passwordError = await UserService.validatePassword(user_password)

        if (passwordError)
            return await res.status(400).json({ error: passwordError })

        const emailError = await UserService.validateEmail(email)

        if (emailError)
            return await res.status(400).json({ error: emailError })

        const emailRegistered = await UserService.hasUserWithUserEmail(
            req.app.get('db'),
            email
        )

        if (emailRegistered)
            return await res.status(400).json({ error: `Email is already associated with an user account` })

        const userRegistered = await UserService.hasUserWithUserName(
            req.app.get('db'),
            username
        )

        if (userRegistered)
            return await res.status(400).json({ error: `Username already taken` })

        const hashedPassword = await UserService.hashPassword(user_password)

        const newUser = {
            fullname,
            username,
            user_password: hashedPassword,
            email,
            about_user,
            user_stack,
            date_created: 'now()',
        }

        await UserService.insertUser(
            req.app.get('db'),
            newUser
        )
            .then(user => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${user.id}`))
                    .json(UserService.serializeUser(user))
            })
    } catch (error) {
        next(error)
    }
}

async function verifyUserExists(req, res, next) {
    try {
        const user = await UserService.getById(
            req.app.get('db'),
            req.params.user_id
        )

        if (!user)
            return await res.status(404).json({
                error: `User not found`
            })

        res.user = user
        next()
    } catch (error) {
        next(error)
    }
}

async function getAllUsers(req, res, next) {
    const users = await UserService.getAllUsersWithAvatar(
        req.app.get('db'),
        req.user.id)
    res
        .status(200)
        .json(users)
}

async function getUser(req, res, next) {
    try {
        await res.json(UserService.serializeUser(res.user))

        next()
    } catch (error) {
        next(error)
    }
}

async function getUserInfoRoute(req, res, next) {
    try {
        const NoPost = await InitPostService.getPostCount(req.app.get('db'), req.params.user_id)
        const FBU = await FollowService.countFollowedbyUser(req.app.get('db'), req.params.user_id)
        const UF = await FollowService.countFollowingUser(req.app.get('db'), req.params.user_id)
        const [userInfo] = await UserService.getUserInfo(req.app.get('db'), req.params.user_id)
        return res
            .status(200)
            .json({
                ...userInfo,
                NoPost: parseInt(NoPost[0].count),
                FBU: parseInt(FBU[0].count),
                UF: parseInt(UF[0].count)
            })

    } catch (error) {
        next(error)
    }
}


module.exports = userRouter