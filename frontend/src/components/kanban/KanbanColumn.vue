<template>
  <div class="column" @dragover.prevent @drop="onDrop">
    <div class="column-header">
      <h2>{{ column.title }}</h2>
      <button @click="$emit('rename-column', column)">Renommer</button>
      <button @click="$emit('delete-column', column)">Supprimer</button>
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
.add-card-btn {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 12px;
  background-color: #f3f4f6;
  border: 2px dashed #9ca3af;
  border-radius: 6px;
  color: #6b7280;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-card-btn:hover {
  background-color: #e5e7eb;
  border-color: #6b7280;
  color: #374151;
}
</style>
