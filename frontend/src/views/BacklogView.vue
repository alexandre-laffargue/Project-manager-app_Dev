<template>
  <div class="backlog-page">
    <h1>Backlog</h1>

    <div v-if="!isAuthenticated">
      <p>Vous devez être connecté(e) pour accéder au backlog.</p>
    </div>

    <div v-else>
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
          <p>
            <strong>Dates :</strong> {{ formatDate(sprint.startDate) }} →
            {{ formatDate(sprint.endDate) }}
          </p>
          <p><strong>Objectif :</strong> {{ sprint.objective }}</p>
          <div class="sprint-actions">
            <button @click="openEditModal(sprint)">Modifier</button>
            <button @click="deleteSprint(sprint)">Supprimer</button>
          </div>
        </div>
      </div>

      <div v-else>
        <p>Aucun sprint créé pour le moment.</p>
      </div>
    </div>

    <!-- Modal d'édition -->
    <div v-if="editingSprintId" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <h2>Modifier le sprint</h2>
        <div class="modal-form">
          <label>
            Nom du sprint :
            <input v-model="editForm.name" placeholder="Nom du sprint" />
          </label>
          <label>
            Date de début :
            <input type="date" v-model="editForm.startDate" />
          </label>
          <label>
            Date de fin :
            <input type="date" v-model="editForm.endDate" />
          </label>
          <label>
            Objectif :
            <textarea v-model="editForm.objective" placeholder="Objectif du sprint" rows="4"></textarea>
          </label>
        </div>
        <div class="modal-actions">
          <button @click="saveEditSprint" class="btn-primary">Enregistrer</button>
          <button @click="closeEditModal" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import '@/assets/backlog.css'
import '@/assets/modal.css'
import { get, post, patch, del } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const isAuthenticated = ref(false)

const sprints = reactive([])
const newSprint = reactive({
  name: '',
  startDate: '',
  endDate: '',
  objective: '',
})

const editingSprintId = ref(null)
const editForm = reactive({
  name: '',
  startDate: '',
  endDate: '',
  objective: '',
})

async function loadBacklog() {
  auth.loadFromStorage()
  isAuthenticated.value = !!auth.token
  if (!isAuthenticated.value) return

  const data = await get('/api/sprints')
  if (!data) return
  data.forEach((s) => sprints.push({ ...s, issues: s.issues || [] }))
}

async function createSprint() {
  if (!newSprint.name.trim()) return alert('Le nom du sprint est obligatoire.')

  try {
    const payload = { ...newSprint }
    const created = await post('/api/sprints', payload)

    const sprintToAdd = {
      _id: created._id || created.id || Date.now().toString(),
      name: created.name || payload.name,
      startDate: created.startDate || payload.startDate,
      endDate: created.endDate || payload.endDate,
      objective: created.objective || payload.objective,
      issues: created.issues || [],
    }

    sprints.push(sprintToAdd)
    newSprint.name = ''
    newSprint.startDate = ''
    newSprint.endDate = ''
    newSprint.objective = ''
  } catch (err) {
    console.error('Erreur lors de la création du sprint :', err)
  }
}

function openEditModal(sprint) {
  editingSprintId.value = sprint._id
  editForm.name = sprint.name
  editForm.startDate = sprint.startDate ? sprint.startDate.split('T')[0] : ''
  editForm.endDate = sprint.endDate ? sprint.endDate.split('T')[0] : ''
  editForm.objective = sprint.objective || ''
}

function closeEditModal() {
  editingSprintId.value = null
  editForm.name = ''
  editForm.startDate = ''
  editForm.endDate = ''
  editForm.objective = ''
}

async function saveEditSprint() {
  if (!editForm.name.trim()) {
    alert('Le nom du sprint est obligatoire.')
    return
  }

  try {
    const updated = await patch(`/api/sprints/${editingSprintId.value}`, {
      name: editForm.name,
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      objective: editForm.objective,
    })

    const sprint = sprints.find((s) => s._id === editingSprintId.value)
    if (sprint) {
      sprint.name = updated.name
      sprint.startDate = updated.startDate
      sprint.endDate = updated.endDate
      sprint.objective = updated.objective
    }

    closeEditModal()
  } catch (err) {
    console.error('Erreur lors de la modification du sprint :', err)
    alert('Erreur lors de la modification du sprint.')
  }
}

async function deleteSprint(sprint) {
  if (!confirm(`Supprimer le sprint "${sprint.name}" ?`)) return
  await del(`/api/sprints/${sprint._id}`)
  const index = sprints.findIndex((s) => s._id === sprint._id)
  if (index !== -1) sprints.splice(index, 1)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

onMounted(() => {
  loadBacklog().catch((err) => console.error(err))
})
</script>
