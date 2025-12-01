<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content modal-large">
        <h2>{{ title }}</h2>
        <div class="modal-form">
          <label>
            Nom du sprint :
            <input v-model="form.name" placeholder="Nom du sprint" />
          </label>
          <label>
            Date de début :
            <input type="date" v-model="form.startDate" />
          </label>
          <label>
            Date de fin :
            <input type="date" v-model="form.endDate" />
          </label>
          <label>
            Objectif :
            <textarea v-model="form.objective" placeholder="Objectif du sprint" rows="4"></textarea>
          </label>
          
          <div class="issues-section">
            <h3>Issues du sprint</h3>
            <p class="help-text">Sélectionnez les issues à inclure dans ce sprint :</p>
            <div v-if="availableIssues.length" class="issues-list">
              <label 
                v-for="issue in availableIssues" 
                :key="issue._id"
                class="issue-checkbox"
              >
                <input 
                  type="checkbox" 
                  :value="issue._id"
                  v-model="selectedIssueIds"
                />
                <span class="issue-info">
                  <strong>{{ issue.title }}</strong>
                  <span class="issue-meta">
                    <span class="badge type">{{ issue.type }}</span>
                    <span class="badge priority" :class="issue.priority.toLowerCase()">{{ issue.priority }}</span>
                  </span>
                </span>
              </label>
            </div>
            <p v-else class="no-issues">Aucune issue disponible. Créez d'abord des issues.</p>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="handleSave" class="btn-primary">{{ saveButtonText }}</button>
          <button @click="$emit('close')" class="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  sprint: { type: Object, default: null },
  availableIssues: { type: Array, default: () => [] },
  title: { type: String, default: 'Créer un sprint' },
  saveButtonText: { type: String, default: 'Créer' }
})

const emit = defineEmits(['close', 'save'])

const form = reactive({
  name: '',
  startDate: '',
  endDate: '',
  objective: '',
})

const selectedIssueIds = ref([])

function resetForm() {
  form.name = ''
  form.startDate = ''
  form.endDate = ''
  form.objective = ''
  selectedIssueIds.value = []
}

watch(() => props.sprint, (newSprint) => {
  if (newSprint) {
    form.name = newSprint.name
    form.startDate = newSprint.startDate ? newSprint.startDate.split('T')[0] : ''
    form.endDate = newSprint.endDate ? newSprint.endDate.split('T')[0] : ''
    form.objective = newSprint.objective || ''
    selectedIssueIds.value = newSprint.issues ? newSprint.issues.map(i => i._id || i) : []
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.show, (newShow, oldShow) => {
  // Réinitialiser le formulaire quand le modal se ferme (après création)
  if (oldShow && !newShow && !props.sprint) {
    resetForm()
  }
})

function handleSave() {
  if (!form.name.trim()) {
    alert('Le nom du sprint est obligatoire.')
    return
  }
  emit('save', { 
    ...form,
    issues: selectedIssueIds.value 
  })
}
</script>

<style scoped>
.modal-large {
  min-width: 600px;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.issues-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.issues-section h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #333;
}

.help-text {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 0.9rem;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
}

.issue-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.issue-checkbox:hover {
  border-color: #7b5fc0;
  box-shadow: 0 2px 4px rgba(123, 95, 192, 0.1);
}

.issue-checkbox input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.issue-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.issue-info strong {
  color: #333;
}

.issue-meta {
  display: flex;
  gap: 6px;
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge.type {
  background-color: #e3f2fd;
  color: #1976d2;
}

.badge.priority.low {
  background-color: #e8f5e9;
  color: #388e3c;
}

.badge.priority.medium {
  background-color: #fff3e0;
  color: #f57c00;
}

.badge.priority.high {
  background-color: #ffebee;
  color: #d32f2f;
}

.no-issues {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 16px;
}
</style>
