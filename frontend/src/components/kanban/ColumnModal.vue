<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Modifier la colonne' : 'Nouvelle colonne' }}</h2>
          <button class="close-btn" @click="close">×</button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label for="column-title">Nom de la colonne *</label>
            <input
              id="column-title"
              v-model="formData.title"
              type="text"
              placeholder="Nom de la colonne"
              required
            />
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
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  column: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'submit'])

const isEditMode = ref(false)
const formData = ref({
  title: '',
})

watch(
  () => props.column,
  (newColumn) => {
    if (newColumn) {
      isEditMode.value = true
      formData.value = {
        title: newColumn.title || '',
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
  }
}

function handleSubmit() {
  const title = (formData.value.title || '').trim()
  if (!title) return

  emit('submit', { title })
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

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.95rem;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
