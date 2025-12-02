<template>
  <div class="timeline-list">
    <div class="timeline-list-header">
      <h3>Mes chronologies</h3>
      <button @click="$emit('create')" class="btn-add">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nouvelle chronologie
      </button>
    </div>

    <div v-if="timelines.length === 0" class="empty-state">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
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
      <p>Aucune chronologie</p>
      <p class="empty-hint">Créez votre première chronologie pour commencer</p>
    </div>

    <div v-else class="timeline-items">
      <div
        v-for="timeline in timelines"
        :key="timeline._id"
        :class="['timeline-item', { active: currentTimeline?._id === timeline._id }]"
        @click="$emit('select', timeline)"
      >
        <div class="timeline-item-content">
          <div class="timeline-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
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
          </div>
          <div class="timeline-info">
            <div class="timeline-name">{{ timeline.name }}</div>
            <div class="timeline-meta">
              <span>{{ formatDate(timeline.snapshotDate) }}</span>
              <span v-if="timeline.version" class="timeline-version">v{{ timeline.version }}</span>
            </div>
          </div>
        </div>
        <div class="timeline-actions">
          <button @click.stop="$emit('edit', timeline)" class="action-btn" title="Modifier">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button @click.stop="handleDelete(timeline)" class="action-btn delete" title="Supprimer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  timelines: {
    type: Array,
    default: () => [],
  },
  currentTimeline: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['create', 'select', 'edit', 'delete'])

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function handleDelete(timeline) {
  if (confirm(`Supprimer la chronologie "${timeline.name}" ?`)) {
    emit('delete', timeline)
  }
}
</script>

<style scoped>
.timeline-list {
  width: 100%;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.timeline-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.timeline-list-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  background: #7b5fc0;
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #a07ff0;
  transform: translateY(-1px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #6b7280;
}

.empty-state svg {
  color: #9ca3af;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 4px 0;
}

.empty-state p:first-of-type {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.empty-hint {
  font-size: 14px;
  color: #9ca3af;
}

.timeline-items {
  max-height: 300px;
  overflow-y: auto;
}

.timeline-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.2s;
}

.timeline-item:last-child {
  border-bottom: none;
}

.timeline-item:hover {
  background: #f9fafb;
}

.timeline-item.active {
  background: #ede9fe;
  border-left: 3px solid #7b5fc0;
}

.timeline-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.timeline-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
}

.timeline-item.active .timeline-icon {
  background: #7b5fc0;
  color: white;
}

.timeline-info {
  flex: 1;
}

.timeline-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.timeline-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.timeline-version {
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
  font-weight: 500;
}

.timeline-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.timeline-item:hover .timeline-actions {
  opacity: 1;
}

.action-btn {
  padding: 6px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.delete:hover {
  background: #fee2e2;
  color: #dc2626;
}
</style>
