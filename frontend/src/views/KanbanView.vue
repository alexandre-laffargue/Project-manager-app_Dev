<template>
  <div class="kanban-page">
    <div class="kanban-header">
      <h1>Tableau Kanban</h1>
      <div v-if="isAuthenticated" class="action-buttons">
        <button @click="openColumnModal" class="btn-create"><span>+</span> Nouvelle colonne</button>
      </div>
    </div>

    <div v-if="!isAuthenticated">
      <p>Vous devez être connecté(e) pour accéder au tableau Kanban.</p>
    </div>

    <div v-else>
      <div class="kanban-board">
        <KanbanColumn
          v-for="column in columns"
          :key="column._id"
          :column="column"
          @create-card="handleCreateCard"
          @delete-card="handleDeleteCard"
          @update-card="handleUpdateCard"
          @start-drag="startDrag"
          @drop-task="dropTask"
          @rename-column="openEditColumnModal"
          @delete-column="deleteColumn"
        />
      </div>
    </div>

    <!-- Modal de création/édition de colonne -->
    <ColumnModal
      :is-open="showColumnModal"
      :column="editingColumn"
      @close="closeColumnModal"
      @submit="handleColumnSubmit"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import '@/assets/kanban.css'
import '@/assets/modal.css'
import KanbanColumn from '@/components/kanban/KanbanColumn.vue'
import ColumnModal from '@/components/kanban/ColumnModal.vue'
import useKanbanBoard from '@/composables/kanban/useKanbanBoard'

const {
  columns,
  isAuthenticated,
  addColumn,
  renameColumn,
  deleteColumn,
  handleCreateCard,
  handleDeleteCard,
  handleUpdateCard,
  startDrag,
  dropTask,
} = useKanbanBoard()

const showColumnModal = ref(false)
const editingColumn = ref(null)

function openColumnModal() {
  editingColumn.value = null
  showColumnModal.value = true
}

function openEditColumnModal(column) {
  editingColumn.value = column
  showColumnModal.value = true
}

function closeColumnModal() {
  showColumnModal.value = false
  editingColumn.value = null
}

async function handleColumnSubmit(payload) {
  if (editingColumn.value) {
    // Mode édition
    await renameColumn(editingColumn.value, payload.title)
  } else {
    // Mode création
    await addColumn(payload.title)
  }
  closeColumnModal()
}
</script>

<style scoped>
.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.kanban-header h1 {
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-create {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background-color: #7b5fc0;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-create span {
  font-size: 1.3rem;
  font-weight: bold;
}

.btn-create:hover {
  background-color: #a07ff0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(123, 95, 192, 0.3);
}

.btn-create:active {
  background-color: #5a3e99;
  transform: translateY(0);
}
</style>
