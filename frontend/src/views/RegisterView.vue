<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="handleRegister" novalidate>
      <h1>S'inscrire</h1>

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
        <label for="name">Nom</label>
        <input
          id="name"
          type="text"
          v-model="form.name"
          :class="{ invalid: errors.name }"
          autocomplete="name"
          required
        />
        <p class="error" v-if="errors.name">{{ errors.name }}</p>
      </div>

      <div class="field">
        <label for="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          v-model="form.password"
          :class="{ invalid: errors.password }"
          autocomplete="new-password"
          required
        />
        <p class="error" v-if="errors.password">{{ errors.password }}</p>
      </div>

      <div class="field">
        <label for="confirm">Confirmer mot de passe</label>
        <input
          id="confirm"
          type="password"
          v-model="form.confirmPassword"
          :class="{ invalid: errors.confirm }"
          required
        />
        <p class="error" v-if="errors.confirm">{{ errors.confirm }}</p>
      </div>

      <p class="error general" v-if="errors.general">{{ errors.general }}</p>

      <button type="submit" :disabled="loading">
        <span v-if="loading">Inscription...</span>
        <span v-else>S'inscrire</span>
      </button>

      <p class="signup-link">
        Déjà un compte ?
        <router-link to="/login">Se connecter</router-link>
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

const form = reactive({ email: '', name: '', password: '', confirmPassword: '' })
const errors = reactive({ name: '', email: '', password: '', confirm: '', general: '' })
const loading = ref(false)

function validate() {
  let ok = true
  errors.email = ''
  errors.password = ''
  errors.confirm = ''
  errors.general = ''

  if (!form.email) {
    errors.email = "L'adresse e-mail est requise."
    ok = false
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = "L'adresse e-mail n'est pas valide."
    ok = false
  }

  if (!form.name) {
    errors.name = 'Le nom est requis.'
    ok = false
  } else if (form.name.length < 2) {
    errors.name = 'Le nom doit contenir au moins 2 caractères.'
    ok = false
  }

  if (!form.password) {
    errors.password = 'Le mot de passe est requis.'
    ok = false
  } else if (form.password.length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères.'
    ok = false
  }

  if (form.password !== form.confirmPassword) {
    errors.confirm = 'Les mots de passe ne correspondent pas.'
    ok = false
  }

  return ok
}

async function handleRegister() {
  if (!validate()) return
  loading.value = true
  try {
    await auth.register({ email: form.email, password: form.password, name: form.name })
    // success
    await router.push('/login')
  } catch (err) {
    errors.general = err.message || "Erreur lors de l'inscription."
  } finally {
    loading.value = false
  }
}
</script>
