<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="selector-container">
      <div class="selector-header">
        <h2>Sélectionner les éléments</h2>
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

      <div class="selector-body">
        <div class="selector-tabs">
          <button
            :class="['tab-btn', { active: activeTab === 'sprints' }]"
            @click="activeTab = 'sprints'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Sprints ({{ localSelectedSprints.length }}/{{ sprints.length }})
          </button>
          <button
            :class="['tab-btn', { active: activeTab === 'issues' }]"
            @click="activeTab = 'issues'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Issues ({{ localSelectedIssues.length }}/{{ issues.length }})
          </button>
        </div>

        <div class="selector-content">
          <!-- Sprints Tab -->
          <div v-if="activeTab === 'sprints'" class="items-list">
            <div class="list-header">
              <label class="checkbox-label">
                <input type="checkbox" :checked="allSprintsSelected" @change="toggleAllSprints" />
                <span>Tout sélectionner</span>
              </label>
              <span class="item-count">{{ sprints.length }} sprint(s)</span>
            </div>

            <div v-if="sprints.length === 0" class="empty-state">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <p>Aucun sprint disponible</p>
            </div>

            <div v-else class="items-grid">
              <label v-for="sprint in sprints" :key="sprint._id" class="item-card">
                <input
                  type="checkbox"
                  :value="sprint._id"
                  :checked="localSelectedSprints.includes(sprint._id)"
                  @change="toggleSprint(sprint._id)"
                />
                <div class="item-content">
                  <div class="item-header">
                    <span class="item-name">{{ sprint.name }}</span>
                    <span :class="['item-status', getSprintStatusClass(sprint)]">
                      {{ getSprintStatus(sprint) }}
                    </span>
                  </div>
                  <div class="item-meta">
                    <span v-if="sprint.startDate">{{ formatDate(sprint.startDate) }}</span>
                    <span v-if="sprint.startDate && sprint.endDate">→</span>
                    <span v-if="sprint.endDate">{{ formatDate(sprint.endDate) }}</span>
                  </div>
                  <div v-if="sprint.goal" class="item-goal">{{ sprint.goal }}</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Issues Tab -->
          <div v-if="activeTab === 'issues'" class="items-list">
            <div class="list-header">
              <label class="checkbox-label">
                <input type="checkbox" :checked="allIssuesSelected" @change="toggleAllIssues" />
                <span>Tout sélectionner</span>
              </label>
              <span class="item-count">{{ issues.length }} issue(s)</span>
            </div>

            <div v-if="issues.length === 0" class="empty-state">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <p>Aucune issue disponible</p>
            </div>

            <div v-else class="items-grid">
              <label v-for="issue in issues" :key="issue._id" class="item-card">
                <input
                  type="checkbox"
                  :value="issue._id"
                  :checked="localSelectedIssues.includes(issue._id)"
                  @change="toggleIssue(issue._id)"
                />
                <div class="item-content">
                  <div class="item-header">
                    <span class="item-name">{{ issue.title }}</span>
                    <span :class="['item-priority', `priority-${issue.priority}`]">
                      {{ issue.priority }}
                    </span>
                  </div>
                  <div class="item-meta">
                    <span class="issue-type">{{ issue.type }}</span>
                    <span v-if="issue.status" class="issue-status">{{ issue.status }}</span>
                  </div>
                  <div v-if="issue.description" class="item-description">
                    {{ truncate(issue.description, 80) }}
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="selector-footer">
        <div class="selection-summary">
          {{ localSelectedSprints.length }} sprint(s) et {{ localSelectedIssues.length }} issue(s)
          sélectionné(s)
        </div>
        <div class="footer-actions">
          <button @click="$emit('close')" class="btn-secondary">Annuler</button>
          <button @click="handleSave" class="btn-primary">Valider la sélection</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  sprints: {
    type: Array,
    default: () => [],
  },
  issues: {
    type: Array,
    default: () => [],
  },
  selectedSprints: {
    type: Array,
    default: () => [],
  },
  selectedIssues: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'save'])

const activeTab = ref('sprints')
const localSelectedSprints = ref([])
const localSelectedIssues = ref([])

const allSprintsSelected = computed(() => {
  return props.sprints.length > 0 && localSelectedSprints.value.length === props.sprints.length
})

const allIssuesSelected = computed(() => {
  return props.issues.length > 0 && localSelectedIssues.value.length === props.issues.length
})

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      localSelectedSprints.value = [...props.selectedSprints]
      localSelectedIssues.value = [...props.selectedIssues]
    }
  },
)

function toggleSprint(sprintId) {
  const index = localSelectedSprints.value.indexOf(sprintId)
  const isSelecting = index === -1

  // Toggle Sprint
  if (isSelecting) {
    localSelectedSprints.value.push(sprintId)
  } else {
    localSelectedSprints.value.splice(index, 1)
  }

  // Toggle related issues
  const sprintIssues = props.issues.filter((i) => i.sprintId === sprintId)
  sprintIssues.forEach((issue) => {
    const issueIndex = localSelectedIssues.value.indexOf(issue._id)
    if (isSelecting) {
      if (issueIndex === -1) localSelectedIssues.value.push(issue._id)
    } else {
      if (issueIndex > -1) localSelectedIssues.value.splice(issueIndex, 1)
    }
  })
}

function toggleIssue(issueId) {
  const index = localSelectedIssues.value.indexOf(issueId)
  if (index > -1) {
    localSelectedIssues.value.splice(index, 1)
  } else {
    localSelectedIssues.value.push(issueId)
  }
}

function toggleAllSprints(event) {
  if (event.target.checked) {
    localSelectedSprints.value = props.sprints.map((s) => s._id)
  } else {
    localSelectedSprints.value = []
  }
}

function toggleAllIssues(event) {
  if (event.target.checked) {
    localSelectedIssues.value = props.issues.map((i) => i._id)
  } else {
    localSelectedIssues.value = []
  }
}

function getSprintStatus(sprint) {
  const now = new Date()
  const start = sprint.startDate ? new Date(sprint.startDate) : null
  const end = sprint.endDate ? new Date(sprint.endDate) : null

  if (!start || !end) return 'Non planifié'
  if (now < start) return 'À venir'
  if (now > end) return 'Terminé'
  return 'En cours'
}

function getSprintStatusClass(sprint) {
  const status = getSprintStatus(sprint)
  if (status === 'En cours') return 'status-active'
  if (status === 'Terminé') return 'status-done'
  if (status === 'À venir') return 'status-upcoming'
  return 'status-unplanned'
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}

function truncate(text, length) {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

function handleSave() {
  emit('save', {
    sprints: localSelectedSprints.value,
    issues: localSelectedIssues.value,
  })
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

.selector-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.selector-header h2 {
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

.selector-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.selector-tabs {
  display: flex;
  gap: 4px;
  padding: 16px 24px 0;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  border-radius: 8px 8px 0 0;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-btn.active {
  background: #f9fafb;
  color: #7b5fc0;
  border-bottom-color: #7b5fc0;
}

.selector-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.checkbox-label input[type='checkbox'] {
  cursor: pointer;
}

.item-count {
  font-size: 13px;
  color: #6b7280;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #9ca3af;
}

.empty-state p {
  margin-top: 16px;
  font-size: 14px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.item-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.item-card:hover {
  border-color: #7b5fc0;
  background: #f9fafb;
}

.item-card input[type='checkbox'] {
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
}

.item-card input[type='checkbox']:checked ~ .item-content {
  opacity: 1;
}

.item-content {
  flex: 1;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.item-card:has(input:checked) .item-content {
  opacity: 1;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  flex: 1;
}

.item-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
}

.status-active {
  background: #dbeafe;
  color: #1e40af;
}

.status-done {
  background: #dcfce7;
  color: #166534;
}

.status-upcoming {
  background: #fef3c7;
  color: #92400e;
}

.status-unplanned {
  background: #f3f4f6;
  color: #6b7280;
}

.item-priority {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
}

.priority-high {
  background: #fee2e2;
  color: #991b1b;
}

.priority-medium {
  background: #fef3c7;
  color: #92400e;
}

.priority-low {
  background: #dbeafe;
  color: #1e40af;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.issue-type {
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
  font-weight: 500;
}

.issue-status {
  padding: 2px 6px;
  background: #ede9fe;
  color: #7b5fc0;
  border-radius: 4px;
  font-weight: 500;
}

.item-goal,
.item-description {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.selector-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.selection-summary {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.footer-actions {
  display: flex;
  gap: 12px;
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
