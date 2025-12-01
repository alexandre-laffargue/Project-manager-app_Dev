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
            <div v-if="availableIssues.length" class="modal-issues-list">
              <label v-for="issue in availableIssues" :key="issue._id" class="issue-checkbox">
                <input type="checkbox" :value="issue._id" v-model="selectedIssueIds" />
                <span class="issue-info">
                  <strong>{{ issue.title }}</strong>
                  <span class="issue-meta">
                    <span class="badge type">{{ issue.type }}</span>
                    <span class="badge priority" :class="issue.priority.toLowerCase()">{{
                      issue.priority
                    }}</span>
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
  saveButtonText: { type: String, default: 'Créer' },
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

watch(
  () => props.sprint,
  (newSprint) => {
    if (newSprint) {
      form.name = newSprint.name
      form.startDate = newSprint.startDate ? newSprint.startDate.split('T')[0] : ''
      form.endDate = newSprint.endDate ? newSprint.endDate.split('T')[0] : ''
      form.objective = newSprint.objective || ''
      selectedIssueIds.value = newSprint.issues ? newSprint.issues.map((i) => i._id || i) : []
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
    if (oldShow && !newShow && !props.sprint) {
      resetForm()
    }
  },
)

function handleSave() {
  if (!form.name.trim()) {
    alert('Le nom du sprint est obligatoire.')
    return
  }
  emit('save', {
    ...form,
    issues: selectedIssueIds.value,
  })
}
</script>
