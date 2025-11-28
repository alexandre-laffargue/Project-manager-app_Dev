<template>
  <div class="kanban-page">
    <h1>Tableau Kanban</h1>

    <div v-if="!isAuthenticated">
      <p>Vous devez être connecté(e) pour accéder au tableau Kanban.</p>
    </div>

    <div v-else>
      <!-- Boutons pour gérer les colonnes -->
      <div class="kanban-controls">
        <input v-model="newColumnName" placeholder="Nom de la colonne" />
        <button @click="addColumn">Ajouter une colonne</button>
      </div>

      <div class="kanban-board">
        <KanbanColumn
          v-for="column in columns"
          :key="column._id"
          :column="column"
          @create-card="handleCreateCard"
          @delete-card="handleDeleteCard"
          @update-card="handleUpdateCard"
          @start-drag="startDrag"
          @drop-task="dropTask"
          @rename-column="renameColumn"
          @delete-column="deleteColumn"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import '@/assets/kanban.css'
import KanbanColumn from '@/components/kanban/KanbanColumn.vue'
import useKanbanBoard from '@/composables/kanban/useKanbanBoard'

const {
  columns,
  newColumnName,
  isAuthenticated,
  addColumn,
  renameColumn,
  deleteColumn,
  handleCreateCard,
  handleDeleteCard,
  handleUpdateCard,
  startDrag,
  dropTask,
} = useKanbanBoard()
</script>
