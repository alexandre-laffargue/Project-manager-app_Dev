<template>
  <div class="sprint-card">
    <div class="sprint-header">
      <div class="sprint-info">
        <h3>{{ sprint.name }}</h3>
        <div class="sprint-dates">
          <span class="date-icon">📅</span>
          <span>{{ formatDate(sprint.startDate) }} → {{ formatDate(sprint.endDate) }}</span>
        </div>
      </div>
      <div class="sprint-badge">
        <span class="issue-count">{{ issueCount }} issue{{ issueCount > 1 ? 's' : '' }}</span>
      </div>
    </div>

    <div class="sprint-objective">
      <strong>Objectif :</strong> {{ sprint.objective || 'Aucun objectif défini' }}
    </div>

    <div class="sprint-actions">
      <button @click="toggleIssues" class="btn-view-issues">
        <span>{{ showIssues ? '▼' : '▶' }}</span>
        {{ showIssues ? 'Masquer' : 'Voir' }} les issues
      </button>
      <button @click="$emit('edit', sprint)" class="btn-edit">Modifier</button>
      <button @click="$emit('delete', sprint)" class="btn-delete">Supprimer</button>
    </div>

    <div v-if="showIssues" class="sprint-issues">
      <div v-if="linkedIssues.length" class="issues-list">
        <div v-for="issue in linkedIssues" :key="issue._id" class="issue-item">
          <span class="issue-title">{{ issue.title }}</span>
          <div class="issue-badges">
            <span class="badge type">{{ issue.type }}</span>
            <span class="badge priority" :class="issue.priority.toLowerCase()">{{
              issue.priority
            }}</span>
          </div>
        </div>
      </div>
      <div v-else class="no-issues">
        <p>Aucune issue liée à ce sprint</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  sprint: { type: Object, required: true },
  allIssues: { type: Array, default: () => [] },
})

defineEmits(['edit', 'delete'])

const showIssues = ref(false)

const linkedIssues = computed(() => {
  if (!props.allIssues || !props.sprint._id) return []
  const sprintId = String(props.sprint._id)
  return props.allIssues.filter((issue) => {
    if (!issue.sprintId) return false
    return String(issue.sprintId) === sprintId
  })
})

const issueCount = computed(() => linkedIssues.value.length)

function toggleIssues() {
  showIssues.value = !showIssues.value
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}
</script>

<style scoped>
.sprint-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.sprint-card:hover {
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.sprint-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.sprint-info h3 {
  margin: 0 0 8px 0;
  font-size: 1.4rem;
  font-weight: 600;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.sprint-dates {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.date-icon {
  font-size: 1rem;
}

.sprint-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.issue-count {
  white-space: nowrap;
}

.sprint-objective {
  background: rgba(255, 255, 255, 0.15);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.95rem;
  line-height: 1.5;
}

.sprint-objective strong {
  display: block;
  margin-bottom: 4px;
  font-size: 0.85rem;
  opacity: 0.8;
}

.sprint-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sprint-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-view-issues {
  flex: 1;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-view-issues:hover {
  background: rgba(255, 255, 255, 0.35);
}

.btn-view-issues span {
  font-size: 0.8rem;
}

.btn-edit {
  background: white;
  color: #667eea;
}

.btn-edit:hover {
  background: #f0f0f0;
  transform: translateY(-1px);
}

.btn-delete {
  background: #ff5252;
  color: white;
}

.btn-delete:hover {
  background: #ff1744;
  transform: translateY(-1px);
}

.sprint-issues {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.issue-item {
  background: rgba(255, 255, 255, 0.15);
  padding: 10px 12px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.issue-item:hover {
  background: rgba(255, 255, 255, 0.25);
}

.issue-title {
  font-weight: 500;
  flex: 1;
}

.issue-badges {
  display: flex;
  gap: 6px;
}

.badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge.type {
  background-color: rgba(255, 255, 255, 0.9);
  color: #1976d2;
}

.badge.priority.low {
  background-color: rgba(255, 255, 255, 0.9);
  color: #388e3c;
}

.badge.priority.medium {
  background-color: rgba(255, 255, 255, 0.9);
  color: #f57c00;
}

.badge.priority.high {
  background-color: rgba(255, 255, 255, 0.9);
  color: #d32f2f;
}

.no-issues {
  text-align: center;
  padding: 20px;
  opacity: 0.7;
  font-style: italic;
}

.no-issues p {
  margin: 0;
}
</style>
