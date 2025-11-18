import { defineStore } from 'pinia'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    loadFromStorage() {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      const user = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
      if (token) {
        this.token = token
        api.setAuthToken(token)
      }
      if (user) this.user = JSON.parse(user)
    },

    async login({ email, password, remember }) {
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        throw new Error("Adresse e-mail invalide")
      }
      if (!password || password.length < 8) {
        throw new Error('Mot de passe invalide (minimum 8 caractères)')
      }

      // Call backend
      const payload = await api.post('/api/auth/login', { email, password })

      const { token, user } = payload
      this.token = token
      this.user = user
      api.setAuthToken(token)

      const storage = remember ? localStorage : sessionStorage
      storage.setItem('auth_token', token)
      storage.setItem('auth_user', JSON.stringify(user))

      return { token, user }
    },

    async register({ email, password, name, remember }) {
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        throw new Error("Adresse e-mail invalide")
      }
      if (!password || password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères')
      }
      if (!name || name.length < 2) {
        throw new Error('Nom invalide')
      }

      const payload = await api.post('/api/auth/register', { email, password, name })

      // backend returns token + user on register
      const { token, user } = payload
      this.token = token
      this.user = user
      api.setAuthToken(token)

      const storage = remember ? localStorage : sessionStorage
      storage.setItem('auth_token', token)
      storage.setItem('auth_user', JSON.stringify(user))

      return { token, user }
    },

    logout() {
      this.token = null
      this.user = null
      api.setAuthToken(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_user')
    },
  },
})
