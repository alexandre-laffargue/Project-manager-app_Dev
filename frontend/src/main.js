import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'
import './assets/auth.css'
import './assets/badges.css'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// initialize auth store from storage so components (LeftNav, etc.) see the state immediately
const auth = useAuthStore()
auth.loadFromStorage()

app.mount('#app')
