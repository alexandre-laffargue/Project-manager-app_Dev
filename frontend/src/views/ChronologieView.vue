<template>
  <div class="chronologie-page">
    <div class="chronologie-header">
      <div class="header-left">
        <h1>Chronologie</h1>
        <div v-if="currentTimeline" class="current-timeline-badge">
          {{ currentTimeline.name }}
        </div>
      </div>
      <div v-if="isAuthenticated" class="action-buttons">
        <button @click="showTimelineList = !showTimelineList" class="timeline-selector-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Chronologies
        </button>

        <button @click="openItemsSelector" class="select-items-btn" :disabled="!currentTimeline">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          Sélectionner
        </button>
        <div class="view-mode-controls">
          <button
            v-for="mode in viewModes"
            :key="mode.value"
            @click="viewMode = mode.value"
            :class="['view-mode-btn', { active: viewMode === mode.value }]"
          >
            {{ mode.label }}
          </button>
        </div>

        <div class="date-jump-control">
          <input
            type="date"
            :value="currentDateStr"
            @change="handleDateJump"
            class="date-input"
            title="Aller à une date"
          />
        </div>

        <button @click="goToToday" class="btn-today">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Aujourd'hui
        </button>
        <div class="zoom-controls">
          <button @click="decreaseZoom" class="zoom-btn" :disabled="zoom <= 0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="8" y1="11" x2="14" y2="11"></line>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
          <button @click="increaseZoom" class="zoom-btn" :disabled="zoom >= 2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        <button @click="handleRefresh" class="btn-refresh" :disabled="loading">
          <svg
            v-if="!loading"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
            />
          </svg>
          <span v-else class="loading-icon"></span>
          Actualiser
        </button>
      </div>
    </div>

    <!-- Timeline List Dropdown -->
    <div v-if="showTimelineList" class="timeline-dropdown">
      <TimelineList
        :timelines="timelines"
        :currentTimeline="currentTimeline"
        @create="openCreateModal"
        @select="handleSelectTimeline"
        @edit="openEditModal"
        @delete="handleDeleteTimeline"
      />
    </div>

    <div v-if="!isAuthenticated" class="auth-message">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
      <p>Vous devez être connecté(e) pour accéder à la chronologie.</p>
    </div>

    <div v-else class="chronologie-content">
      <div v-if="!currentTimeline" class="no-timeline-state">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <p>Aucune chronologie disponible</p>
        <p class="hint">Créez votre première chronologie pour commencer</p>
        <button @click="showCreateTimelineModal = true" class="btn-create-timeline">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Créer une chronologie
        </button>
      </div>
      <GanttChart
        v-else
        ref="ganttChartRef"
        :tasks="sortedTasks"
        :loading="loading"
        :error="error"
        :view-mode="viewMode"
        :zoom="zoom"
        @reload="loadTimelines"
        @task-updated="handleTaskUpdate"
        @open-selector="openItemsSelector"
      />
    </div>

    <!-- Timeline Modals -->
    <TimelineModal
      :show="showCreateTimelineModal"
      title="Nouvelle chronologie"
      saveButtonText="Créer"
      @close="closeCreateModal"
      @save="handleCreateTimeline"
    />

    <TimelineModal
      :show="showEditTimelineModal"
      :timeline="editingTimeline"
      title="Modifier la chronologie"
      saveButtonText="Enregistrer"
      @close="closeEditModal"
      @save="handleUpdateTimeline"
    />

    <TimelineItemsSelector
      :show="showItemsSelectorModal"
      :sprints="sprints"
      :issues="issues"
      :selectedSprints="selectedSprints"
      :selectedIssues="selectedIssues"
      @close="closeItemsSelector"
      @save="handleSaveSelectedItems"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GanttChart from '@/components/timeline/GanttChart.vue'
import TimelineList from '@/components/timeline/TimelineList.vue'
import TimelineModal from '@/components/timeline/TimelineModal.vue'
import TimelineItemsSelector from '@/components/timeline/TimelineItemsSelector.vue'
import { useTimeline } from '@/composables/timeline/useTimeline'

const ganttChartRef = ref(null)
const showTimelineList = ref(false)
const currentDateStr = ref(new Date().toISOString().split('T')[0])

const {
  isAuthenticated,
  loading,
  error,
  tasks,
  sortedTasks,
  viewMode,
  zoom,
  timelines,
  currentTimeline,
  showCreateTimelineModal,
  showEditTimelineModal,
  showItemsSelectorModal,
  editingTimeline,
  sprints,
  issues,
  selectedSprints,
  selectedIssues,
  loadTimelines,
  selectTimeline,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  refreshTimeline,
  updateTaskDates,
  openEditTimelineModal,
  closeEditTimelineModal,
  openItemsSelector,
  closeItemsSelector,
  saveSelectedItems,
} = useTimeline()

const viewModes = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
]

function increaseZoom() {
  if (zoom.value < 2) {
    zoom.value = Math.min(2, zoom.value + 0.25)
  }
}

function decreaseZoom() {
  if (zoom.value > 0.5) {
    zoom.value = Math.max(0.5, zoom.value - 0.25)
  }
}

function handleDateJump(e) {
  const dateVal = e.target.value
  if (dateVal && ganttChartRef.value) {
    ganttChartRef.value.scrollToDate(dateVal)
    currentDateStr.value = dateVal
  }
}

function goToToday() {
  if (ganttChartRef.value && ganttChartRef.value.goToToday) {
    ganttChartRef.value.goToToday()
    currentDateStr.value = new Date().toISOString().split('T')[0]
  }
}

async function handleRefresh() {
  try {
    await refreshTimeline()
  } catch (err) {
    console.error('Error refreshing timeline:', err)
  }
}

async function handleTaskUpdate(task, start, end) {
  try {
    await updateTaskDates(task, start, end)
  } catch (err) {
    console.error('Error updating task dates:', err)
    // Reload to revert changes
    await loadTimelines()
  }
}

function openCreateModal() {
  showTimelineList.value = false
  showCreateTimelineModal.value = true
}

function closeCreateModal() {
  showCreateTimelineModal.value = false
}

function openEditModal(timeline) {
  showTimelineList.value = false
  openEditTimelineModal(timeline)
}

function closeEditModal() {
  closeEditTimelineModal()
}

async function handleSelectTimeline(timeline) {
  await selectTimeline(timeline)
}

async function handleCreateTimeline(formData) {
  try {
    await createTimeline(formData)
    closeCreateModal()
  } catch (err) {
    console.error('Error creating timeline:', err)
    alert('Erreur lors de la création de la chronologie')
  }
}

async function handleUpdateTimeline(formData) {
  try {
    if (editingTimeline.value) {
      await updateTimeline(editingTimeline.value._id, formData)
      closeEditModal()
    }
  } catch (err) {
    console.error('Error updating timeline:', err)
    alert('Erreur lors de la mise à jour de la chronologie')
  }
}

async function handleDeleteTimeline(timeline) {
  try {
    await deleteTimeline(timeline)
  } catch (err) {
    console.error('Error deleting timeline:', err)
    alert('Erreur lors de la suppression de la chronologie')
  }
}

async function handleSaveSelectedItems(selection) {
  // Saving selection
  try {
    await saveSelectedItems(selection)
    // Scroll to first task after update
    if (ganttChartRef.value && ganttChartRef.value.scrollToFirstTask) {
      setTimeout(() => {
        ganttChartRef.value.scrollToFirstTask()
      }, 100)
    }
  } catch (err) {
    console.error('Error saving selected items:', err)
    alert('Erreur lors de la sauvegarde de la sélection')
  }
}

onMounted(() => {
  loadTimelines().catch((err) => console.error(err))
})
</script>

<style scoped>
.chronologie-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
  background: #ffffff;
  margin-left: 220px;
  overflow: hidden;
}

.chronologie-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chronologie-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.current-timeline-badge {
  padding: 6px 14px;
  background: #ede9fe;
  color: #7b5fc0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}

.timeline-selector-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.timeline-selector-btn:hover {
  background: #f3f4f6;
  border-color: #7b5fc0;
  color: #7b5fc0;
}

.select-items-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #7b5fc0;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #7b5fc0;
  cursor: pointer;
  transition: all 0.2s;
}

.select-items-btn:hover:not(:disabled) {
  background: #7b5fc0;
  color: #fff;
}

.select-items-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #e5e7eb;
  color: #9ca3af;
}

.timeline-dropdown {
  position: absolute;
  top: 88px;
  right: 32px;
  width: 400px;
  z-index: 100;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 20px;
}

.view-mode-controls {
  display: flex;
  gap: 8px;
  background: #fff;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.view-mode-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.view-mode-btn:hover {
  background: #f3f4f6;
  color: #374151;
}
.view-mode-btn.active {
  background: #7b5fc0;
  color: #fff;
  box-shadow: 0 2px 4px rgba(123, 95, 192, 0.2);
}

.date-jump-control {
  display: flex;
  align-items: center;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
}

.date-input:focus {
  border-color: #7b5fc0;
  box-shadow: 0 0 0 2px rgba(123, 95, 192, 0.1);
}

.btn-today {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-today:hover {
  background: #f3f4f6;
  border-color: #7b5fc0;
  color: #7b5fc0;
}

.btn-today svg {
  flex-shrink: 0;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.zoom-btn {
  padding: 6px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #6b7280;
}

.zoom-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

.zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.zoom-level {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  min-width: 50px;
  text-align: center;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background-color: #7b5fc0;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background-color: #a07ff0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(123, 95, 192, 0.3);
}

.btn-refresh:active:not(:disabled) {
  background-color: #5a3e99;
  transform: translateY(0);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-message {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #6b7280;
  padding: 48px 24px;
}

.auth-message svg {
  color: #9ca3af;
}

.auth-message p {
  font-size: 16px;
  margin: 0;
}

.chronologie-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.no-timeline-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px 24px;
  color: #6b7280;
}

.no-timeline-state svg {
  color: #9ca3af;
}

.no-timeline-state p {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.no-timeline-state .hint {
  font-size: 14px;
  font-weight: 400;
  color: #9ca3af;
}

.btn-create-timeline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  margin-top: 16px;
  border: none;
  background: #7b5fc0;
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-timeline:hover {
  background: #a07ff0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(123, 95, 192, 0.3);
}

.btn-create-timeline:active {
  background: #5a3e99;
  transform: translateY(0);
}
</style>
