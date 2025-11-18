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
        <div
          class="column"
          v-for="column in columns"
          :key="column._id"
          @dragover.prevent
          @drop="dropTask(column._id)"
        >
          <div class="column-header">
            <h2>{{ column.title }}</h2>
            <button @click="renameColumn(column)">Renommer</button>
            <button @click="deleteColumn(column)">Supprimer</button>
          </div>

          <div class="tasks-list">
            <!-- Ajouter une carte -->
            <div class="add-card">
  <input v-model="newCardTitle[column._id]" placeholder="Titre de la carte" />
  <input v-model="newCardDescription[column._id]" placeholder="Description" />
  <select v-model="newCardPriority[column._id]">
    <option>Low</option>
    <option>Medium</option>
    <option>High</option>
  </select>
  <select v-model="newCardType[column._id]">
    <option>Bug</option>
    <option>Feature</option>
    <option>Task</option>
  </select>
  <button @click="addCard(column)">Ajouter</button>
</div>


            <div
  class="task"
  v-for="task in column.tasks"
  :key="task._id"
  draggable="true"
  @dragstart="startDrag(task, column._id)"
>
  <h3 class="task-title">{{ task.title }}</h3>
  <p class="task-desc">{{ task.description }}</p>

  <div class="task-meta">
    <span class="badge priority" :class="task.priority.toLowerCase()">{{ task.priority }}</span>
    <span class="badge type">{{ task.type }}</span>
  </div>

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
const newCardDescription = reactive({})
const newCardPriority = reactive({})
const newCardType = reactive({})

let currentBoardId = null
let draggedTask = null
let draggedFromColumnId = null


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
  columns.forEach(c => {
    newCardTitle[c._id] = ''
    newCardDescription[c._id] = ''
    newCardPriority[c._id] = 'Medium'
    newCardType[c._id] = 'Task'
  })
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

async function addCard(column) {
  const title = (newCardTitle[column._id] || '').trim()
  if (!title) return

  const payload = {
    title,
    description: newCardDescription[column._id] || '',
    priority: newCardPriority[column._id] || 'Medium',
    type: newCardType[column._id] || 'Task',
    columnId: column._id,
    position: column.tasks.length
  }

  const created = await post(`/api/boards/${currentBoardId}/cards`, payload)
  column.tasks.push(created)

  // reset
  newCardTitle[column._id] = ''
  newCardDescription[column._id] = ''
  newCardPriority[column._id] = 'Medium'
  newCardType[column._id] = 'Task'
}

async function editCard(column, task) {
  const newTitle = prompt('Titre :', task.title)
  const newDescription = prompt('Description :', task.description)
  const newPriority = prompt('Priorité (Low/Medium/High) :', task.priority)
  const newType = prompt('Type (Bug/Feature/Task) :', task.type)

  if (!newTitle?.trim()) return

  const updated = await patch(`/api/cards/${task._id}`, {
    title: newTitle.trim(),
    description: newDescription || '',
    priority: newPriority || 'Medium',
    type: newType || 'Task'
  })

  task.title = updated.title
  task.description = updated.description
  task.priority = updated.priority
  task.type = updated.type
}


async function deleteCard(column, task) {
  if (!confirm('Supprimer cette carte ?')) return
  await del(`/api/cards/${task._id}`)
  const index = column.tasks.findIndex(t => t._id === task._id)
  if (index !== -1) column.tasks.splice(index, 1)
}

function startDrag(task, columnId) {
  draggedTask = task
  draggedFromColumnId = columnId
}

async function dropTask(targetColumnId) {
  if (!draggedTask || !draggedFromColumnId) return
  if (draggedFromColumnId === targetColumnId) {
    draggedTask = null
    draggedFromColumnId = null
    return
  }
  const fromCol = columns.find(c => c._id === draggedFromColumnId)
  fromCol.tasks = fromCol.tasks.filter(t => t._id !== draggedTask._id)
  const toCol = columns.find(c => c._id === targetColumnId)
  toCol.tasks.push(draggedTask)
  await patch(`/api/cards/${draggedTask._id}`, { tocolumnId: targetColumnId })
  draggedTask = null
  draggedFromColumnId = null
}



onMounted(() => {
  loadBoardData().catch(err => console.error('failed to load board data', err))
})
</script>
