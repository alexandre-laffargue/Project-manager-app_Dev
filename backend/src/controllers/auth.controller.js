const bcrypt = require('bcryptjs')
const Joi = require('joi')
const User = require('../models/User')
const { signJwt, signRefreshToken, verifyJwt } = require('../utils/jwt')

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required()
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
})

async function register (req, res, next) {
  try {
    const validated = await registerSchema.validateAsync(req.body || {})
    const { email, password, name } = validated

    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ error: 'Email already used' })

    const passwordHash = await bcrypt.hash(password, 10)
    const refreshToken = signRefreshToken({ sub: email })
    const user = await User.create({ email, passwordHash, name, refreshToken })

    const token = signJwt({
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles
    })
    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        roles: user.roles
      }
    })
  } catch (err) {
    if (err.isJoi) err.status = 400
    next(err)
  }
}

async function login (req, res, next) {
  try {
    const validatedLogin = await loginSchema.validateAsync(req.body || {})
    const { email, password } = validatedLogin

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const refreshToken = signRefreshToken({ sub: user.email })
    user.refreshToken = refreshToken
    await user.save()

    const token = signJwt({
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles
    })
    res.json({
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        roles: user.roles
      }
    })
  } catch (err) {
    if (err.isJoi) err.status = 400
    next(err)
  }
}

async function refresh (req, res, next) {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) { return res.status(401).json({ error: 'Refresh token required' }) }

    // Vérifier la validité du refresh token
    let payload
    try {
      payload = verifyJwt(refreshToken)
    } catch (e) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    // Vérifier que le refresh token existe en base
    const user = await User.findOne({ email: payload.sub, refreshToken })
    if (!user) return res.status(401).json({ error: 'Invalid refresh token' })

    // Générer un nouveau access token
    const token = signJwt({
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles
    })
    res.json({ token })
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, refresh }
