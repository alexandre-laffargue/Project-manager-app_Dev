<template>
  <div class="task" draggable="true" @dragstart="onDragStart">
    <h3 class="task-title">{{ card.title }}</h3>
    <p class="task-desc">{{ card.description }}</p>

    <div class="task-meta">
      <span class="badge priority" :class="(card.priority || 'medium').toLowerCase()">{{
        card.priority || 'Medium'
      }}</span>
      <span class="badge type">{{ card.type || 'Task' }}</span>
    </div>

    <div class="task-actions">
      <button @click="openEditModal">Modifier</button>
      <button @click="$emit('delete', card)">X</button>
    </div>
  </div>

  <!-- Modal d'édition -->
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <h2>Modifier la carte</h2>
        <div class="modal-form">
          <label>
            Titre :
            <input v-model="state.title" placeholder="Titre de la carte" />
          </label>
          <label>
            Description :
            <textarea v-model="state.description" placeholder="Description" rows="4"></textarea>
          </label>
          <label>
            Priorité :
            <select v-model="state.priority">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </label>
          <label>
            Type :
            <select v-model="state.type">
              <option>Bug</option>
              <option>Feature</option>
              <option>Task</option>
            </select>
          </label>
        </div>
        <div class="modal-actions">
          <button @click="save" class="btn-primary">Enregistrer</button>
          <button @click="closeEditModal" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref } from 'vue'
import '@/assets/modal.css'

const props = defineProps({
  card: { type: Object, required: true },
})
const emits = defineEmits(['update', 'delete', 'start-drag'])

const showModal = ref(false)
const state = reactive({ title: '', description: '', priority: 'Medium', type: 'Task' })

function openEditModal() {
  state.title = props.card.title || ''
  state.description = props.card.description || ''
  state.priority = props.card.priority || 'Medium'
  state.type = props.card.type || 'Task'
  showModal.value = true
}

function closeEditModal() {
  showModal.value = false
}

async function save() {
  const title = (state.title || '').trim()
  if (!title) {
    alert('Le titre est obligatoire.')
    return
  }
  const allowedPriorities = ['Low', 'Medium', 'High']
  const allowedTypes = ['Bug', 'Feature', 'Task']
  const payload = {
    title,
    description: state.description || '',
    priority: allowedPriorities.includes(state.priority) ? state.priority : 'Medium',
    type: allowedTypes.includes(state.type) ? state.type : 'Task',
  }
  emits('update', props.card, payload)
  closeEditModal()
}

function onDragStart() {
  emits('start-drag', props.card)
}
</script>
