<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h2>{{ title }}</h2>
        <button @click="$emit('close')" class="close-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="timeline-name">Nom de la chronologie</label>
          <input
            id="timeline-name"
            v-model="localTimeline.name"
            type="text"
            placeholder="Ex: Sprint 1 - Développement"
            class="form-input"
          />
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-secondary">Annuler</button>
        <button @click="handleSave" class="btn-primary">{{ saveButtonText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  timeline: {
    type: Object,
    default: null,
  },
  title: {
    type: String,
    default: 'Nouvelle chronologie',
  },
  saveButtonText: {
    type: String,
    default: 'Créer',
  },
})

const emit = defineEmits(['close', 'save'])

const localTimeline = ref({
  name: '',
})

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.timeline) {
        localTimeline.value = {
          name: props.timeline.name || '',
        }
      } else {
        localTimeline.value = {
          name: '',
        }
      }
    }
  },
)

function handleSave() {
  if (!localTimeline.value.name.trim()) {
    alert('Veuillez entrer un nom pour la chronologie')
    return
  }

  emit('save', localTimeline.value)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6b7280;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #7b5fc0;
  box-shadow: 0 0 0 3px rgba(123, 95, 192, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary {
  padding: 10px 20px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

.btn-primary {
  padding: 10px 20px;
  border: none;
  background: #7b5fc0;
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #a07ff0;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(123, 95, 192, 0.3);
}

.btn-primary:active {
  background: #5a3e99;
  transform: translateY(0);
}
</style>
