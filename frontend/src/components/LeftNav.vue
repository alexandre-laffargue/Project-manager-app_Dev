<template>
  <aside class="left-nav" aria-label="Barre de navigation verticale">
    <nav class="nav-container">
      <ul class="nav-list">
        <li
          class="nav-item"
          :class="{ active: selected === 'Kanban' }"
          @click="select('Kanban')"
          @keydown.enter.prevent="select('Kanban')"
          @keydown.space.prevent="select('Kanban')"
          role="button"
          tabindex="0"
        >
          <span class="dot" aria-hidden="true"></span>
          <span class="label">Kanban</span>
        </li>

        <li
          class="nav-item"
          :class="{ active: selected === 'Backlog' }"
          @click="select('Backlog')"
          @keydown.enter.prevent="select('Backlog')"
          @keydown.space.prevent="select('Backlog')"
          role="button"
          tabindex="0"
        >
          <span class="dot" aria-hidden="true"></span>
          <span class="label">Backlog</span>
        </li>

        <li
          class="nav-item"
          :class="{ active: selected === 'Chronologie' }"
          @click="select('Chronologie')"
          @keydown.enter.prevent="select('Chronologie')"
          @keydown.space.prevent="select('Chronologie')"
          role="button"
          tabindex="0"
        >
          <span class="dot" aria-hidden="true"></span>
          <span class="label">Chronologie</span>
        </li>
      </ul>

      <div class="nav-bottom">
        <template v-if="auth.isAuthenticated">
          <div class="user-info">
            Bonjour, <strong>{{ auth.user ? auth.user.name : auth.user }}</strong>
          </div>
          <button class="login-btn" @click="logout">Déconnexion</button>
        </template>
        <template v-else>
          <button class="login-btn" @click="onLogin">Se connecter</button>
        </template>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import '@/assets/leftnav.css'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const selected = ref('Kanban')

const routeToName = {
  '/kanban': 'Kanban',
  '/backlog': 'Backlog',
  '/chronologie': 'Chronologie',
}

const nameToRoute = {
  Kanban: '/kanban',
  Backlog: '/backlog',
  Chronologie: '/chronologie',
}

// initialize selected from current route
selected.value = routeToName[route.path] || 'Kanban'

// keep selection in sync when route changes externally
watch(
  () => route.path,
  (p) => {
    selected.value = routeToName[p] || selected.value
  },
)

function select(name) {
  selected.value = name
  const to = nameToRoute[name]
  if (to && route.path !== to) {
    router.push(to)
  }
}

function onLogin() {
  router.push('/login')
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
