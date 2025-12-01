<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content modal-large">
        <h2>{{ title }}</h2>
        <div class="modal-form">
          <label>
            Titre :
            <input v-model="form.title" placeholder="Titre de l'issue" />
          </label>
          <label>
            Description :
            <textarea v-model="form.description" placeholder="Description" rows="4"></textarea>
          </label>
          <label>
            Type :
            <select v-model="form.type">
              <option value="Task">Task</option>
              <option value="Bug">Bug</option>
              <option value="Feature">Feature</option>
            </select>
          </label>
          <label>
            Priorité :
            <select v-model="form.priority">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
          <label>
            Sprint :
            <select v-model="form.sprintId">
              <option :value="null">Aucun sprint (Backlog)</option>
              <option v-for="sprint in availableSprints" :key="sprint._id" :value="sprint._id">
                {{ sprint.name }}
              </option>
            </select>
          </label>

          <div class="checklist-section">
            <h3>Checklist</h3>
            <div v-if="form.checklist.length" class="checklist-items">
              <div v-for="(item, index) in form.checklist" :key="item.id" class="checklist-item">
                <input type="checkbox" v-model="item.checked" :id="'check-' + item.id" />
                <input
                  type="text"
                  v-model="item.text"
                  placeholder="Tâche à faire"
                  class="checklist-text"
                />
                <button type="button" @click="removeChecklistItem(index)" class="btn-remove">
                  ✕
                </button>
              </div>
            </div>
            <button type="button" @click="addChecklistItem" class="btn-add-checklist">
              + Ajouter une tâche
            </button>
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
import { reactive, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  issue: { type: Object, default: null },
  availableSprints: { type: Array, default: () => [] },
  title: { type: String, default: 'Créer une issue' },
  saveButtonText: { type: String, default: 'Créer' },
})

const emit = defineEmits(['close', 'save'])

const form = reactive({
  title: '',
  description: '',
  type: 'Task',
  priority: 'Medium',
  sprintId: null,
  checklist: [],
})

function resetForm() {
  form.title = ''
  form.description = ''
  form.type = 'Task'
  form.priority = 'Medium'
  form.sprintId = null
  form.checklist = []
}

function addChecklistItem() {
  form.checklist.push({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    text: '',
    checked: false,
  })
}

function removeChecklistItem(index) {
  form.checklist.splice(index, 1)
}

watch(
  () => props.issue,
  (newIssue) => {
    if (newIssue) {
      form.title = newIssue.title
      form.description = newIssue.description || ''
      form.type = newIssue.type || 'Task'
      form.priority = newIssue.priority || 'Medium'
      form.sprintId = newIssue.sprintId || null
      form.checklist = newIssue.checklist ? JSON.parse(JSON.stringify(newIssue.checklist)) : []
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

watch(
  () => props.show,
  (newShow, oldShow) => {
    // Réinitialiser le formulaire quand le modal se ferme (après création)
    if (oldShow && !newShow && !props.issue) {
      resetForm()
    }
  },
)

function handleSave() {
  if (!form.title.trim()) {
    alert("Le titre de l'issue est obligatoire.")
    return
  }
  emit('save', {
    title: form.title,
    description: form.description,
    type: form.type,
    priority: form.priority,
    sprintId: form.sprintId,
    checklist: form.checklist,
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

.checklist-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.checklist-section h3 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  color: #333;
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.checklist-item input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checklist-text {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.btn-remove {
  padding: 4px 8px;
  background: #ff5252;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.btn-remove:hover {
  background: #ff1744;
}

.btn-add-checklist {
  padding: 8px 16px;
  background: #7b5fc0;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-add-checklist:hover {
  background: #a07ff0;
  transform: translateY(-1px);
}
</style>
