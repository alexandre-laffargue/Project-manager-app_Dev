<template>
  <div class="backlog-page">
    <div class="backlog-header">
      <h1>Backlog</h1>
      <div v-if="isAuthenticated" class="action-buttons">
        <button @click="showCreateSprintModal = true" class="btn-create">
          <span>+</span> Nouveau Sprint
        </button>
        <button @click="showCreateIssueModal = true" class="btn-create">
          <span>+</span> Nouvelle Issue
        </button>
      </div>
    </div>

    <div v-if="!isAuthenticated">
      <p>Vous devez être connecté(e) pour accéder au backlog.</p>
    </div>

    <div v-else>
      <SprintList 
        :sprints="sprints"
        :all-issues="issues"
        @edit-sprint="openEditSprintModal"
        @delete-sprint="deleteSprint"
      />

      <IssueList 
        :issues="issues"
        @edit-issue="openEditIssueModal"
        @delete-issue="deleteIssue"
      />
    </div>

    <!-- Modal de création de sprint -->
    <SprintModal
      :show="showCreateSprintModal"
      :available-issues="issues"
      title="Créer un sprint"
      saveButtonText="Créer"
      @close="showCreateSprintModal = false"
      @save="createSprint"
    />

    <!-- Modal d'édition de sprint -->
    <SprintModal
      :show="showEditSprintModal"
      :sprint="editingSprint"
      :available-issues="issues"
      title="Modifier le sprint"
      saveButtonText="Enregistrer"
      @close="closeEditSprintModal"
      @save="saveEditSprint"
    />

    <!-- Modal de création d'issue -->
    <IssueModal
      :show="showCreateIssueModal"
      :available-sprints="sprints"
      title="Créer une issue"
      saveButtonText="Créer"
      @close="showCreateIssueModal = false"
      @save="createIssue"
    />

    <!-- Modal d'édition d'issue -->
    <IssueModal
      :show="showEditIssueModal"
      :issue="editingIssue"
      :available-sprints="sprints"
      title="Modifier l'issue"
      saveButtonText="Enregistrer"
      @close="closeEditIssueModal"
      @save="saveEditIssue"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import '@/assets/backlog.css'
import '@/assets/modal.css'
import SprintList from '@/components/backlog/SprintList.vue'
import IssueList from '@/components/backlog/IssueList.vue'
import SprintModal from '@/components/backlog/SprintModal.vue'
import IssueModal from '@/components/backlog/IssueModal.vue'
import { useBacklog } from '@/composables/backlog/useBacklog'

const {
  isAuthenticated,
  sprints,
  issues,
  showCreateSprintModal,
  showCreateIssueModal,
  showEditSprintModal,
  showEditIssueModal,
  editingSprint,
  editingIssue,
  loadBacklog,
  createSprint,
  openEditSprintModal,
  closeEditSprintModal,
  saveEditSprint,
  deleteSprint,
  createIssue,
  openEditIssueModal,
  closeEditIssueModal,
  saveEditIssue,
  deleteIssue,
} = useBacklog()

onMounted(() => {
  loadBacklog().catch((err) => console.error(err))
})
</script>

<style scoped>
.backlog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.backlog-header h1 {
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-create {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background-color: #7b5fc0;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-create span {
  font-size: 1.3rem;
  font-weight: bold;
}

.btn-create:hover {
  background-color: #a07ff0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(123, 95, 192, 0.3);
}

.btn-create:active {
  background-color: #5a3e99;
  transform: translateY(0);
}
</style>
