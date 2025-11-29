const jwt = require('jsonwebtoken')

function signJwt (payload, options = {}) {
  const secret = process.env.JWT_SECRET
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d'
  return jwt.sign(payload, secret, { expiresIn, ...options })
}

function signRefreshToken (payload) {
  const secret = process.env.JWT_SECRET
  const expiresIn = '7d' // Refresh token valide 7 jours
  return jwt.sign(payload, secret, { expiresIn })
}

function verifyJwt (token) {
  const secret = process.env.JWT_SECRET
  return jwt.verify(token, secret)
}

module.exports = { signJwt, signRefreshToken, verifyJwt }
