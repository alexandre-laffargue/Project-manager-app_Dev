<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEditMode ? 'Modifier la carte' : 'Nouvelle carte' }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label for="task-title">Titre *</label>
          <input
            id="task-title"
            v-model="formData.title"
            type="text"
            placeholder="Titre de la carte"
            required
          />
        </div>

        <div class="form-group">
          <label for="task-description">Description</label>
          <textarea
            id="task-description"
            v-model="formData.description"
            rows="4"
            placeholder="Description de la carte"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="task-priority">Priorité</label>
            <select id="task-priority" v-model="formData.priority">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div class="form-group">
            <label for="task-type">Type</label>
            <select id="task-type" v-model="formData.type">
              <option value="Bug">Bug</option>
              <option value="Feature">Feature</option>
              <option value="Task">Task</option>
            </select>
          </div>
        </div>

        <div class="modal-actions">
          <button type="submit" class="btn-primary">
            {{ isEditMode ? 'Enregistrer' : 'Créer' }}
          </button>
          <button type="button" class="btn-secondary" @click="close">Annuler</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  task: {
    type: Object,
    default: null,
  },
  columnId: {
    type: String,
    required: true,
  },
  position: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['close', 'submit'])

const isEditMode = ref(false)
const formData = ref({
  title: '',
  description: '',
  priority: 'Medium',
  type: 'Task',
})

watch(
  () => props.task,
  (newTask) => {
    if (newTask) {
      isEditMode.value = true
      formData.value = {
        title: newTask.title || '',
        description: newTask.description || '',
        priority: newTask.priority || 'Medium',
        type: newTask.type || 'Task',
      }
    } else {
      isEditMode.value = false
      resetForm()
    }
  },
  { immediate: true },
)

function resetForm() {
  formData.value = {
    title: '',
    description: '',
    priority: 'Medium',
    type: 'Task',
  }
}

function handleSubmit() {
  const title = (formData.value.title || '').trim()
  if (!title) return

  const payload = {
    title,
    description: formData.value.description || '',
    priority: formData.value.priority || 'Medium',
    type: formData.value.type || 'Task',
  }

  if (!isEditMode.value) {
    payload.columnId = props.columnId
    payload.position = props.position
  }

  emit('submit', payload)
  resetForm()
}

function close() {
  emit('close')
  resetForm()
}
</script>

<style scoped>
.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #374151;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
