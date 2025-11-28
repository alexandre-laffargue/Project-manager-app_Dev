const mongoose = require('mongoose')

function wait (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function connectDB () {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI missing in env')

  mongoose.set('strictQuery', true)

  const maxAttempts = 10
  let attempt = 0
  while (attempt < maxAttempts) {
    try {
      attempt++
      await mongoose.connect(uri)
      console.log('[mongo] connected')
      return
    } catch (err) {
      console.warn(`[mongo] connection attempt ${attempt} failed: ${err.message}`)
      if (attempt >= maxAttempts) throw err
      // exponential backoff with jitter
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 30000)
      const jitter = Math.floor(Math.random() * 500)
      await wait(delay + jitter)
    }
  }
}

module.exports = { connectDB }
