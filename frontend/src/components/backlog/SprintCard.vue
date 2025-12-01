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
