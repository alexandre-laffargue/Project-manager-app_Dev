<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="handleSubmit" novalidate>
      <h1>Connexion</h1>

      <div class="field">
        <label for="email">Adresse e-mail</label>
        <input
          id="email"
          type="email"
          v-model="form.email"
          :class="{ invalid: errors.email }"
          autocomplete="username"
          required
        />
        <p class="error" v-if="errors.email">{{ errors.email }}</p>
      </div>

      <div class="field">
        <label for="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          v-model="form.password"
          :class="{ invalid: errors.password }"
          autocomplete="current-password"
          required
        />
        <p class="error" v-if="errors.password">{{ errors.password }}</p>
      </div>

      <div class="field remember">
        <label>
          <input type="checkbox" v-model="form.remember" />
          Se souvenir de moi
        </label>
      </div>

      <p class="error general" v-if="errors.general">{{ errors.general }}</p>

      <button type="submit" :disabled="loading">
        <span v-if="loading">Connexion...</span>
        <span v-else>Se connecter</span>
      </button>

      <p class="signup-link">
        Pas de compte ?
        <router-link to="/register">S'inscrire</router-link>
      </p>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  email: '',
  password: '',
  remember: false,
})

const errors = reactive({
  email: '',
  password: '',
  general: '',
})

const loading = ref(false)

function validate() {
  let ok = true
  errors.email = ''
  errors.password = ''
  errors.general = ''

  if (!form.email) {
    errors.email = "L'adresse e-mail est requise."
    ok = false
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = "L'adresse e-mail n'est pas valide."
    ok = false
  }

  if (!form.password) {
    errors.password = 'Le mot de passe est requis.'
    ok = false
  } else if (form.password.length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères.'
    ok = false
  }

  return ok
}

async function handleSubmit() {
  if (!validate()) return

  loading.value = true
  errors.general = ''

  try {
    // Use the Pinia auth store (mock login)
    const result = await auth.login({
      email: form.email,
      password: form.password,
      remember: form.remember,
    })
    if (result && result.token) {
      await router.push('/kanban')
    }
  } catch (err) {
    console.error(err)
    errors.general = err.message || 'Impossible de contacter le serveur. Réessayez plus tard.'
  } finally {
    loading.value = false
  }
}
</script>
