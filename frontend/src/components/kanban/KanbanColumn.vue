<template>
  <div class="column" @dragover.prevent @drop="onDrop">
    <div class="column-header">
      <h2>{{ column.title }}</h2>
      <div class="column-actions">
        <button class="btn-edit" @click="$emit('rename-column', column)">Renommer</button>
        <button class="btn-delete" @click="$emit('delete-column', column)">Supprimer</button>
      </div>
    </div>

    <div class="tasks-list">
      <!-- Button to open modal for adding card -->
      <button class="add-card-btn" @click="openModal">+ Ajouter une carte</button>

      <KanbanCard
        v-for="task in column.tasks"
        :key="task._id"
        :card="task"
        @start-drag="onStartDrag"
        @update="onUpdate"
        @delete="onDelete"
      />
    </div>

    <TaskModal
      :is-open="isModalOpen"
      :column-id="column._id"
      :position="column.tasks.length"
      @close="closeModal"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import KanbanCard from '@/components/kanban/KanbanCard.vue'
import TaskModal from '@/components/kanban/TaskModal.vue'

const props = defineProps({ column: { type: Object, required: true } })
const emit = defineEmits([
  'create-card',
  'delete-card',
  'update-card',
  'start-drag',
  'rename-column',
  'delete-column',
  'drop-task',
])

const isModalOpen = ref(false)

function openModal() {
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

function handleSubmit(payload) {
  emit('create-card', props.column, payload)
  closeModal()
}

function onStartDrag(card) {
  emit('start-drag', card, props.column._id)
}

function onUpdate(card, payload) {
  emit('update-card', props.column, card, payload)
}

function onDelete(card) {
  emit('delete-card', props.column, card)
}

function onDrop() {
  emit('drop-task', props.column._id)
}
</script>

<style scoped>
.column-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.15);
}

.column-header h2 {
  margin: 0;
  font-size: 1.35rem;
  color: #1f2937;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.column-actions {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn-edit {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-edit:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
}

.btn-delete {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-delete:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);
}

.btn-edit span,
.btn-delete span {
  font-size: 1rem;
  filter: grayscale(0);
}

.add-card-btn {
  width: 100%;
  padding: 14px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border: 2px dashed rgba(102, 126, 234, 0.4);
  border-radius: 10px;
  color: #667eea;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}

.add-card-btn:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  border-color: rgba(102, 126, 234, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.2);
}
</style>
