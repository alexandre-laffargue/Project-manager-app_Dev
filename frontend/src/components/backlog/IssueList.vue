<template>
  <div class="issues-section">
    <h2>📋 Issues du backlog</h2>

    <div v-if="issues.length" class="issues-list">
      <IssueCard
        v-for="issue in issues"
        :key="issue._id"
        :issue="issue"
        @edit="$emit('edit-issue', $event)"
        @delete="$emit('delete-issue', $event)"
      />
    </div>

    <div v-else class="empty-state">
      <p>📝 Aucune issue dans le backlog.</p>
    </div>
  </div>
</template>

<script setup>
import IssueCard from './IssueCard.vue'

defineProps({
  issues: { type: Array, required: true },
})

defineEmits(['edit-issue', 'delete-issue'])
</script>

<style scoped>
.issues-section {
  margin-top: 40px;
}

.issues-section h2 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  color: #333;
}

.issues-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .issues-list {
    grid-template-columns: 1fr;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #f9f9f9;
  border-radius: 12px;
  border: 2px dashed #ddd;
}

.empty-state p {
  margin: 0;
  font-size: 1.1rem;
  color: #999;
}
</style>
