<template>
  <div class="kanban-page">
    <h1>Tableau Kanban</h1>

    <div v-if="!isAuthenticated">
      <p>Vous devez être connecté(e) pour accéder au tableau Kanban.</p>
    </div>

    <div v-else>
      <!-- Boutons pour gérer les colonnes -->
      <div class="kanban-controls">
        <input v-model="newColumnName" placeholder="Nom de la colonne" />
        <button @click="addColumn">Ajouter une colonne</button>
      </div>

      <div class="kanban-board">
        <div class="column" v-for="(column, index) in columns" :key="column._id">
          <div class="column-header">
            <h2>{{ column.title }}</h2>
            <button @click="renameColumn(column)">Renommer</button>
            <button @click="deleteColumn(column, index)">Supprimer</button>
          </div>

        <div class="tasks-list">
          <div class="add-card">
            <input v-model="newCardTitle[column._id]" placeholder="Nouvelle carte" />
            <button @click="addCard(column)">Ajouter</button>
       </div>

        <div class="task" v-for="task in column.tasks" :key="task._id">
          <span>{{ task.title }}</span>
          <div class="task-actions">
            <button @click="editCard(column, task)">Modifier</button>
            <button @click="deleteCard(column, task)">X</button>
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import '@/assets/kanban.css'
import { get, post, patch, del } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const isAuthenticated = ref(false)

const columns = reactive([])
const newColumnName = ref('')
const newCardTitle = reactive({})
let currentBoardId = null

function slugify (text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^a-z0-9-]/g, '')    // Remove all non-word chars
    .replace(/-+/g, '-')           // Replace multiple - with single -
}

async function loadBoardData () {
  // ensure token loaded on api
  auth.loadFromStorage()
  isAuthenticated.value = !!auth.token
  if (!isAuthenticated.value) return

  // get or create board
  const boards = await get('/api/boards/me')
  let board = (boards && boards[0]) || null
  if (!board) {
    board = await post('/api/boards', { name: 'Mon tableau' })
  }
  currentBoardId = board._id

  // fetch columns then cards
  const cols = await get(`/api/boards/${currentBoardId}/columns`)
  const cards = await get(`/api/boards/${currentBoardId}/cards`)

  columns.splice(0, columns.length)
  cols.forEach(c => {
    columns.push({ ...c, tasks: [] })
  })

  // map cards into columns
  cards.forEach(card => {
    const col = columns.find(c => c._id === card.columnId)
    if (col) col.tasks.push(card)
  })

  // init newCardTitle keys
  columns.forEach(c => { newCardTitle[c._id] = '' })
}

async function addColumn () {
  if (!newColumnName.value || !newColumnName.value.trim()) return
  const title = newColumnName.value.trim()
  const key = slugify(title)
  const order = columns.length
  const created = await post(`/api/boards/${currentBoardId}/columns`, { key, title, order })
  columns.push({ ...created, tasks: [] })
  newColumnName.value = ''
}

async function renameColumn (column) {
  const newName = prompt('Nouveau nom de la colonne :', column.title)
  if (!newName || !newName.trim()) return
  const updated = await patch(`/api/columns/${column._id}`, { title: newName.trim() })
  column.title = updated.title
}

async function deleteColumn (column, index) {
  if (!confirm(`Supprimer la colonne "${column.title}" ?`)) return
  await del(`/api/columns/${column._id}`)
  columns.splice(index, 1)
}

async function addCard (column) {
  const title = (newCardTitle[column._id] || '').trim()
  if (!title) return
  const payload = { title, columnId: column._id, position: column.tasks.length }
  const created = await post(`/api/boards/${currentBoardId}/cards`, payload)
  column.tasks.push(created)
  newCardTitle[column._id] = ''
}

async function editCard (column, task) {
  const newTitle = prompt('Modifier la carte :', task.title)
  if (!newTitle?.trim()) return
  const updated = await patch(`/api/cards/${task._id}`, { title: newTitle.trim() })
  task.title = updated.title
}

async function deleteCard(column, task) {
  if (!confirm('Supprimer cette carte ?')) return
  await del(`/api/cards/${task._id}`)
  const index = column.tasks.findIndex(t => t._id === task._id)
  if (index !== -1) column.tasks.splice(index, 1)
}


onMounted(() => {
  loadBoardData().catch(err => console.error('failed to load board data', err))
})
</script>
