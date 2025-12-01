<template>
  <div class="issue">
    <h4>{{ issue.title }}</h4>
    <p>{{ issue.description }}</p>
    <div class="issue-meta">
      <span class="badge type">{{ issue.type }}</span>
      <span class="badge priority" :class="issue.priority.toLowerCase()">{{ issue.priority }}</span>
      <span v-if="issue.sprintId" class="badge sprint">
        Sprint assigné
      </span>
    </div>
    
    <div v-if="issue.checklist && issue.checklist.length" class="checklist-preview">
      <div class="checklist-progress">
        <span class="checklist-icon">✓</span>
        <span>{{ completedCount }}/{{ issue.checklist.length }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <div class="issue-actions">
      <button @click="$emit('edit', issue)">Modifier</button>
      <button @click="$emit('delete', issue)">Supprimer</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  issue: { type: Object, required: true }
})

defineEmits(['edit', 'delete'])

const completedCount = computed(() => {
  if (!props.issue.checklist) return 0
  return props.issue.checklist.filter(item => item.checked).length
})

const progressPercent = computed(() => {
  if (!props.issue.checklist || props.issue.checklist.length === 0) return 0
  return Math.round((completedCount.value / props.issue.checklist.length) * 100)
})
</script>

<style scoped>
.issue {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.issue:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.12);
  border-color: #7b5fc0;
}

.issue h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.issue p {
  margin: 0 0 12px 0;
  color: #666;
}

.issue-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
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

.badge.sprint {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.checklist-preview {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.checklist-progress {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: #555;
}

.checklist-icon {
  font-weight: bold;
  color: #7b5fc0;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #7b5fc0;
  transition: width 0.3s ease;
}

.issue-actions {
  display: flex;
  gap: 8px;
}

.issue-actions button {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.issue-actions button:first-child {
  background-color: #7b5fc0;
  color: white;
}

.issue-actions button:first-child:hover {
  background-color: #a07ff0;
}

.issue-actions button:last-child {
  background-color: #f44336;
  color: white;
}

.issue-actions button:last-child:hover {
  background-color: #e53935;
}
</style>

<style scoped>
.issue {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.issue:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.12);
  border-color: #7b5fc0;
}

.issue h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.issue p {
  margin: 0 0 12px 0;
  color: #666;
}

.issue-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
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

.issue-actions {
  display: flex;
  gap: 8px;
}

.issue-actions button {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.issue-actions button:first-child {
  background-color: #7b5fc0;
  color: white;
}

.issue-actions button:first-child:hover {
  background-color: #a07ff0;
}

.issue-actions button:last-child {
  background-color: #f44336;
  color: white;
}

.issue-actions button:last-child:hover {
  background-color: #e53935;
}
</style>
