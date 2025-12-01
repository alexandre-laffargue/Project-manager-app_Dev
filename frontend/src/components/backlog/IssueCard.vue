<template>
  <div class="issue">
    <h4>{{ issue.title }}</h4>
    <p>{{ issue.description }}</p>
    <div class="issue-meta">
      <span class="badge type">{{ issue.type }}</span>
      <span class="badge priority" :class="issue.priority.toLowerCase()">{{ issue.priority }}</span>
      <span v-if="issue.sprintId" class="badge sprint"> Sprint assigné </span>
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
  issue: { type: Object, required: true },
})

defineEmits(['edit', 'delete'])

const completedCount = computed(() => {
  if (!props.issue.checklist) return 0
  return props.issue.checklist.filter((item) => item.checked).length
})

const progressPercent = computed(() => {
  if (!props.issue.checklist || props.issue.checklist.length === 0) return 0
  return Math.round((completedCount.value / props.issue.checklist.length) * 100)
})
</script>
