import { ref, reactive } from 'vue'
import { get, post, patch, del } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export function useKanbanBoard() {
  const auth = useAuthStore()
  const isAuthenticated = ref(false)

  const columns = reactive([])
  const newColumnName = ref('')

  let currentBoardId = null
  let draggedTask = null
  let draggedFromColumnId = null

  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
  }

  async function loadBoardData() {
    try {
      auth.loadFromStorage()
      isAuthenticated.value = !!auth.token
      if (!isAuthenticated.value) return

      const boards = await get('/api/boards/me')
      let board = (boards && boards[0]) || null
      if (!board) {
        board = await post('/api/boards', { name: 'Mon tableau' })
      }
      currentBoardId = board._id

      const cols = await get(`/api/boards/${currentBoardId}/columns`)
      const cards = await get(`/api/boards/${currentBoardId}/cards`)

      columns.splice(0, columns.length)
      cols.forEach((c) => columns.push({ ...c, tasks: [] }))

      cards.forEach((card) => {
        const col = columns.find((c) => c._id === card.columnId)
        if (col) col.tasks.push(card)
      })
    } catch (err) {
      console.error('useKanbanBoard: failed to load board', err)
    }
  }

  async function addColumn() {
    if (!newColumnName.value || !newColumnName.value.trim()) return
    const title = newColumnName.value.trim()
    const key = slugify(title)
    const order = columns.length
    const created = await post(`/api/boards/${currentBoardId}/columns`, { key, title, order })
    columns.push({ ...created, tasks: [] })
    newColumnName.value = ''
  }

  async function renameColumn(column) {
    const newName = prompt('Nouveau nom de la colonne :', column.title)
    if (!newName || !newName.trim()) return
    const updated = await patch(`/api/columns/${column._id}`, { title: newName.trim() })
    column.title = updated.title
  }

  async function deleteColumn(column) {
    if (!confirm(`Supprimer la colonne "${column.title}" ?`)) return
    await del(`/api/columns/${column._id}`)
    const index = columns.findIndex((c) => c._id === column._id)
    if (index !== -1) columns.splice(index, 1)
  }

  async function handleCreateCard(column, payload) {
    const created = await post(`/api/boards/${currentBoardId}/cards`, payload)
    const col = columns.find((c) => c._id === column._id)
    if (col) col.tasks.push(created)
  }

  async function handleDeleteCard(column, card) {
    if (!confirm('Supprimer cette carte ?')) return
    await del(`/api/cards/${card._id}`)
    const col = columns.find((c) => c._id === column._id)
    if (!col) return
    const index = col.tasks.findIndex((t) => t._id === card._id)
    if (index !== -1) col.tasks.splice(index, 1)
  }

  async function handleUpdateCard(column, card, payload) {
    const updated = await patch(`/api/cards/${card._id}`, payload)
    const col = columns.find((c) => c._id === column._id)
    if (!col) return
    const t = col.tasks.find((x) => x._id === card._id)
    if (!t) return
    t.title = updated.title
    t.description = updated.description
    t.priority = updated.priority
    t.type = updated.type
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
    const fromCol = columns.find((c) => c._id === draggedFromColumnId)
    fromCol.tasks = fromCol.tasks.filter((t) => t._id !== draggedTask._id)
    const toCol = columns.find((c) => c._id === targetColumnId)
    toCol.tasks.push(draggedTask)
    await patch(`/api/cards/${draggedTask._id}`, { toColumnId: targetColumnId })
    draggedTask = null
    draggedFromColumnId = null
  }

  // load immediately when composable is used
  loadBoardData()

  return {
    columns,
    newColumnName,
    isAuthenticated,
    addColumn,
    renameColumn,
    deleteColumn,
    handleCreateCard,
    handleDeleteCard,
    handleUpdateCard,
    startDrag,
    dropTask,
    loadBoardData,
  }
}

export default useKanbanBoard
