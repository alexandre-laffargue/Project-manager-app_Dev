<template>
  <div class="sprints-section">
    <h2>Sprints</h2>

    <div v-if="sprints.length" class="sprints-grid">
      <SprintCard
        v-for="sprint in sprints"
        :key="sprint._id"
        :sprint="sprint"
        :all-issues="allIssues"
        @edit="$emit('edit-sprint', $event)"
        @delete="$emit('delete-sprint', $event)"
      />
    </div>

    <div v-else class="empty-state">
      <p>Aucun sprint créé pour le moment.</p>
    </div>
  </div>
</template>

<script setup>
import SprintCard from './SprintCard.vue'

defineProps({
  sprints: { type: Array, required: true },
  allIssues: { type: Array, default: () => [] },
})

defineEmits(['edit-sprint', 'delete-sprint'])
</script>

<style scoped>
.sprints-section {
  margin-bottom: 40px;
}

.sprints-section h2 {
  margin-bottom: 20px;
  font-size: 1.8rem;
  color: #333;
}

.sprints-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 20px;
}

@media (max-width: 1200px) {
  .sprints-grid {
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
