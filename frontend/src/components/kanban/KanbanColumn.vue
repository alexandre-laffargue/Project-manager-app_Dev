<template>
  <div class="column" @dragover.prevent @drop="onDrop">
    <div class="column-header">
      <h2>{{ column.title }}</h2>
      <button @click="$emit('rename-column', column)">Renommer</button>
      <button @click="$emit('delete-column', column)">Supprimer</button>
    </div>

    <div class="tasks-list">
      <!-- add card form local to column -->
      <div class="add-card">
        <input v-model="newTitle" placeholder="Titre de la carte" />
        <input v-model="newDescription" placeholder="Description" />
        <select v-model="newPriority">
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <select v-model="newType">
          <option>Bug</option>
          <option>Feature</option>
          <option>Task</option>
        </select>
        <button @click="createCard">Ajouter</button>
      </div>

      <KanbanCard
        v-for="task in column.tasks"
        :key="task._id"
        :card="task"
        @start-drag="onStartDrag"
        @update="onUpdate"
        @delete="onDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import KanbanCard from '@/components/kanban/KanbanCard.vue'

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

const newTitle = ref('')
const newDescription = ref('')
const newPriority = ref('Medium')
const newType = ref('Task')

function createCard() {
  const title = (newTitle.value || '').trim()
  if (!title) return
  const payload = {
    title,
    description: newDescription.value || '',
    priority: newPriority.value || 'Medium',
    type: newType.value || 'Task',
    columnId: props.column._id,
    position: props.column.tasks.length,
  }
  emit('create-card', props.column, payload)
  newTitle.value = ''
  newDescription.value = ''
  newPriority.value = 'Medium'
  newType.value = 'Task'
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
.add-card {
  margin-bottom: 12px;
}
</style>
