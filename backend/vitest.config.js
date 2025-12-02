import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.test file for test environment
config({ path: resolve(__dirname, '.env.test') })

export default {
  test: {
    // Increase hook timeout to avoid beforeAll hooks timing out when tests run in parallel
    hookTimeout: 60000,
    // run tests in the same thread/process to avoid flakiness from parallel DB instances
    threads: false,
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
    coverage: {
      enabled: false
    }
  }
}
