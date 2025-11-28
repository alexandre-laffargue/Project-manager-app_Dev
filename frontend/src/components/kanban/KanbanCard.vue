<template>
  <div class="task" draggable="true" @dragstart="onDragStart">
    <!-- View mode -->
    <template v-if="!editing">
      <h3 class="task-title">{{ card.title }}</h3>
      <p class="task-desc">{{ card.description }}</p>

      <div class="task-meta">
        <span class="badge priority" :class="card.priority.toLowerCase()">{{ card.priority }}</span>
        <span class="badge type">{{ card.type }}</span>
      </div>

      <div class="task-actions">
        <button @click="startEdit">Modifier</button>
        <button @click="$emit('delete', card)">X</button>
      </div>
    </template>

    <!-- Edit mode -->
    <template v-else>
      <div class="task-edit">
        <input v-model="state.title" class="edit-title" />
        <textarea v-model="state.description" class="edit-desc"></textarea>
        <div class="edit-controls">
          <select v-model="state.priority">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <select v-model="state.type">
            <option>Bug</option>
            <option>Feature</option>
            <option>Task</option>
          </select>
          <button @click="save">Sauvegarder</button>
          <button @click="cancel">Annuler</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

const props = defineProps({
  card: { type: Object, required: true }
})
const emits = defineEmits(['update', 'delete', 'start-drag'])

const editing = ref(false)
const state = reactive({ title: '', description: '', priority: 'Medium', type: 'Task' })

function startEdit() {
  state.title = props.card.title || ''
  state.description = props.card.description || ''
  state.priority = props.card.priority || 'Medium'
  state.type = props.card.type || 'Task'
  editing.value = true
}

function cancel() {
  editing.value = false
}

async function save() {
  const title = (state.title || '').trim()
  if (!title) return
  const allowedPriorities = ['Low', 'Medium', 'High']
  const allowedTypes = ['Bug', 'Feature', 'Task']
  const payload = {
    title,
    description: state.description || '',
    priority: allowedPriorities.includes(state.priority) ? state.priority : 'Medium',
    type: allowedTypes.includes(state.type) ? state.type : 'Task',
  }
  emits('update', props.card, payload)
  editing.value = false
}

function onDragStart() {
  emits('start-drag', props.card)
}
</script>

<style scoped>
.edit-title { width: 100%; margin-bottom: 6px }
.edit-desc { width: 100%; min-height: 60px }
.edit-controls { display: flex; gap: 8px; align-items: center; margin-top:6px }
</style>
