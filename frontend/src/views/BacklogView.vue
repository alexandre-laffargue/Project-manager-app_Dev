<template>
  <div class="backlog-page">
    <h1>Backlog</h1>

    <div v-if="!isAuthenticated">
      <p>Vous devez être connecté(e) pour accéder au backlog.</p>
    </div>

    <div v-else>
      <!-- Formulaire création sprint -->
      <div class="backlog-controls">
        <h2>Créer un sprint</h2>
        <input v-model="newSprint.name" placeholder="Nom du sprint" />
        <input type="date" v-model="newSprint.startDate" placeholder="Date de début" />
        <input type="date" v-model="newSprint.endDate" placeholder="Date de fin" />
        <textarea v-model="newSprint.objective" placeholder="Objectif du sprint"></textarea>
        <button @click="createSprint">Créer sprint</button>
      </div>

      <!-- Liste des sprints -->
      <div v-if="sprints.length" class="sprints-list">
        <div class="sprint" v-for="sprint in sprints" :key="sprint._id">
          <h3>{{ sprint.name }}</h3>
          <p><strong>Dates :</strong> {{ sprint.startDate }} → {{ sprint.endDate }}</p>
          <p><strong>Objectif :</strong> {{ sprint.objective }}</p>
          <div class="sprint-actions">
            <button @click="editSprint(sprint)">Modifier</button>
            <button @click="deleteSprint(sprint)">Supprimer</button>
          </div>
        </div>
      </div>

      <div v-else>
        <p>Aucun sprint créé pour le moment.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import '@/assets/backlog.css'
import { get, post, patch, del } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const isAuthenticated = ref(false)

const sprints = reactive([]) // <-- réactif pour afficher immédiatement
const newSprint = reactive({
  name: '',
  startDate: '',
  endDate: '',
  objective: ''
})

async function loadBacklog() {
  auth.loadFromStorage()
  isAuthenticated.value = !!auth.token
  if (!isAuthenticated.value) return

  const data = await get('/api/sprints')
  if (!data) return
  data.forEach(s => sprints.push({ ...s, issues: s.issues || [] }))
}

async function createSprint() {
  if (!newSprint.name.trim()) return alert("Le nom du sprint est obligatoire.")

  try {
    const payload = { ...newSprint }
    const created = await post('/api/sprints', payload)

    // Assure-toi qu'il y a un identifiant pour le v-for
    const sprintToAdd = {
      _id: created._id || created.id || Date.now().toString(), // fallback si l'API ne renvoie pas _id
      name: created.name || payload.name,
      startDate: created.startDate || payload.startDate,
      endDate: created.endDate || payload.endDate,
      objective: created.objective || payload.objective,
      issues: created.issues || []
    }

    sprints.push(sprintToAdd) // <-- ajout immédiat dans l'array réactif

    // reset formulaire
    newSprint.name = ''
    newSprint.startDate = ''
    newSprint.endDate = ''
    newSprint.objective = ''
  } catch (err) {
    console.error('Erreur lors de la création du sprint :', err)
  }
}


async function editSprint(sprint) {
  const name = prompt('Nouveau nom du sprint :', sprint.name)
  if (!name?.trim()) return
  const updated = await patch(`/api/sprints/${sprint._id}`, { name })
  sprint.name = updated.name
}

async function deleteSprint(sprint) {
  if (!confirm(`Supprimer le sprint "${sprint.name}" ?`)) return
  await del(`/api/sprints/${sprint._id}`)
  const index = sprints.findIndex(s => s._id === sprint._id)
  if (index !== -1) sprints.splice(index, 1)
}

onMounted(() => {
  loadBacklog().catch(err => console.error(err))
})
</script>
