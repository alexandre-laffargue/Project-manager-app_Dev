<template>
  <div class="timeline-container">
    <!-- Header avec contrôles -->
    <div class="timeline-header">
      <div class="timeline-controls">
        <button
          v-for="mode in viewModes"
          :key="mode.value"
          @click="currentViewMode = mode.value"
          :class="['view-mode-btn', { active: currentViewMode === mode.value }]"
        >
          {{ mode.label }}
        </button>
      </div>

      <div class="timeline-actions">
        <button @click="goToToday" class="today-btn">Aujourd'hui</button>
        <button @click="refreshTimeline" class="refresh-btn" :disabled="loading">
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
          <span v-else class="loading-spinner"></span>
          Actualiser
        </button>
      </div>
    </div>

    <!-- Zone du Gantt -->
    <div v-if="loading && tasks.length === 0" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Chargement de la chronologie...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadTimeline" class="retry-btn">Réessayer</button>
    </div>

    <div v-else-if="tasks.length === 0" class="empty-state">
      <p>Aucune tâche à afficher dans la chronologie.</p>
      <p class="empty-hint">
        Créez des sprints et des issues avec des dates pour les voir apparaître ici.
      </p>
    </div>

    <div v-else class="gantt-wrapper">
      <div
        class="gantt-scroll-container"
        ref="scrollContainer"
        @scroll="handleScroll"
        @wheel="handleWheel"
        @mousedown="startPan"
      >
        <!-- Header dates -->
        <div class="gantt-header" :style="{ width: totalWidth + 'px' }">
          <div class="gantt-sidebar">Tâche</div>
          <div class="gantt-timeline-header">
            <div
              v-for="date in dateHeaders"
              :key="date.key"
              class="gantt-date-cell"
              :style="{ width: cellWidth + 'px' }"
            >
              <div class="date-main">{{ date.main }}</div>
              <div class="date-sub">{{ date.sub }}</div>
              <div v-if="date.extra" class="date-extra">{{ date.extra }}</div>
            </div>
          </div>
        </div>

        <!-- Body avec les tâches -->
        <div class="gantt-body" :style="{ width: totalWidth + 'px' }">
          <div
            v-for="(task, index) in tasks"
            :key="task.id"
            class="gantt-row"
            :class="{ 'row-even': index % 2 === 0 }"
          >
            <div class="gantt-sidebar">
              <div class="task-name" :title="task.name">{{ task.name }}</div>
            </div>
            <div class="gantt-timeline-body">
              <!-- Grille de fond -->
              <div
                v-for="date in dateHeaders"
                :key="date.key"
                class="gantt-grid-cell"
                :style="{ width: cellWidth + 'px' }"
              ></div>

              <!-- Barre de tâche -->
              <div
                class="gantt-bar-wrapper"
                :style="getBarStyle(task)"
                @mousedown="startDrag(task, $event)"
              >
                <div class="gantt-bar" :class="getBarClass(task)" :title="getBarTooltip(task)">
                  <div class="gantt-bar-progress" :style="{ width: task.progress + '%' }"></div>
                  <span class="gantt-bar-label">{{ task.name }}</span>
                </div>
                <div
                  class="gantt-bar-handle handle-left"
                  @mousedown.stop="startResize(task, 'left', $event)"
                ></div>
                <div
                  class="gantt-bar-handle handle-right"
                  @mousedown.stop="startResize(task, 'right', $event)"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ligne aujourd'hui -->
        <div
          v-if="todayPosition >= 0"
          class="today-line"
          :style="{ left: sidebarWidth + todayPosition + 'px' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  boardId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['taskUpdated', 'error'])

// Refs
const scrollContainer = ref(null)
const loading = ref(false)
const error = ref(null)
const tasks = ref([])
const currentViewMode = ref('day')
const viewStartDate = ref(new Date())
const numVisiblePeriods = ref(30) // Nombre de périodes visibles (jours/semaines/mois)
const isPanning = ref(false)
const panStartX = ref(0)
const panStartScrollLeft = ref(0)

// Configuration
const sidebarWidth = 250
const cellWidth = ref(40)
const rowHeight = 50

const viewModes = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
]

// Calcul des dates basé sur la position de vue actuelle
const dateRange = computed(() => {
  const start = new Date(viewStartDate.value)
  const end = new Date(viewStartDate.value)

  if (currentViewMode.value === 'day') {
    end.setDate(end.getDate() + numVisiblePeriods.value)
  } else if (currentViewMode.value === 'week') {
    end.setDate(end.getDate() + numVisiblePeriods.value * 7)
  } else {
    end.setMonth(end.getMonth() + numVisiblePeriods.value)
  }

  return { start, end }
})

const dateHeaders = computed(() => {
  const headers = []
  const { start, end } = dateRange.value
  const current = new Date(start)

  if (currentViewMode.value === 'day') {
    while (current <= end) {
      headers.push({
        key: current.toISOString(),
        main: current.getDate(),
        sub: current.toLocaleDateString('fr-FR', { month: 'short' }),
        date: new Date(current),
      })
      current.setDate(current.getDate() + 1)
    }
  } else if (currentViewMode.value === 'week') {
    // Commencer au début de la semaine
    const startOfWeek = new Date(current)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1) // Lundi
    current.setTime(startOfWeek.getTime())

    while (current <= end) {
      const weekStart = new Date(current)
      const weekEnd = new Date(current)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const weekNum = getWeekNumber(current)
      const monthYear = current.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      const dateRange = `${weekStart.getDate()} - ${weekEnd.getDate()}`

      headers.push({
        key: current.toISOString(),
        main: `Semaine ${weekNum}`,
        sub: dateRange,
        extra: monthYear,
        date: new Date(current),
      })
      current.setDate(current.getDate() + 7)
    }
  } else {
    // Vue mois - commencer au début du mois
    current.setDate(1)

    while (current <= end) {
      const monthName = current.toLocaleDateString('fr-FR', { month: 'long' })
      const year = current.getFullYear()
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()

      headers.push({
        key: current.toISOString(),
        main: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        sub: year,
        extra: `${daysInMonth} jours`,
        date: new Date(current),
      })
      current.setMonth(current.getMonth() + 1)
    }
  }

  return headers
})

const totalWidth = computed(() => {
  return sidebarWidth + dateHeaders.value.length * cellWidth.value
})

const todayPosition = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { start } = dateRange.value

  if (currentViewMode.value === 'day') {
    const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24))
    return diffDays * cellWidth.value
  } else if (currentViewMode.value === 'week') {
    const diffWeeks = Math.floor((today - start) / (1000 * 60 * 60 * 24 * 7))
    return diffWeeks * cellWidth.value
  } else {
    const diffMonths =
      (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth())
    return diffMonths * cellWidth.value
  }
})

// Fonctions
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

function getBarStyle(task) {
  const start = new Date(task.start)
  const end = new Date(task.end)
  const { start: rangeStart } = dateRange.value

  let startOffset, width

  if (currentViewMode.value === 'day') {
    startOffset = Math.floor((start - rangeStart) / (1000 * 60 * 60 * 24))
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    width = duration * cellWidth.value
  } else if (currentViewMode.value === 'week') {
    const msPerWeek = 1000 * 60 * 60 * 24 * 7
    startOffset = (start - rangeStart) / msPerWeek
    const duration = (end - start) / msPerWeek
    width = duration * cellWidth.value
  } else {
    // Vue mois
    const monthsFromStart =
      (start.getFullYear() - rangeStart.getFullYear()) * 12 +
      (start.getMonth() - rangeStart.getMonth())
    const dayRatio =
      start.getDate() / new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    startOffset = monthsFromStart + dayRatio

    const monthsSpan =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    const endDayRatio = end.getDate() / new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()
    const totalMonths = monthsSpan + endDayRatio - dayRatio
    width = totalMonths * cellWidth.value
  }

  return {
    left: startOffset * cellWidth.value + 'px',
    width: Math.max(width, 20) + 'px', // Largeur minimale pour la visibilité
  }
}

function getBarClass(task) {
  const classes = []

  if (task.type === 'sprint') {
    classes.push('bar-sprint')
  } else if (task.type === 'backlog-issue') {
    classes.push('bar-backlog')
  } else {
    classes.push('bar-issue')
  }

  if (task.originalData?.status) {
    classes.push(`bar-${task.originalData.status}`)
  }

  return classes
}

function getBarTooltip(task) {
  const start = new Date(task.start).toLocaleDateString('fr-FR')
  const end = new Date(task.end).toLocaleDateString('fr-FR')
  return `${task.name}\n${start} - ${end}\nProgression: ${task.progress}%`
}

// Drag & Drop
let dragState = null

function startDrag(task, event) {
  event.preventDefault()
  const barElement = event.currentTarget
  const rect = barElement.getBoundingClientRect()

  dragState = {
    task,
    type: 'move',
    startX: event.clientX,
    originalLeft:
      rect.left -
      sidebarWidth -
      scrollContainer.value.getBoundingClientRect().left +
      scrollContainer.value.scrollLeft,
  }

  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
}

function startResize(task, handle, event) {
  event.preventDefault()

  dragState = {
    task,
    type: 'resize',
    handle,
    startX: event.clientX,
  }

  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
}

function handleDragMove(event) {
  if (!dragState) return

  const deltaX = event.clientX - dragState.startX
  let deltaDays

  if (currentViewMode.value === 'day') {
    deltaDays = Math.round(deltaX / cellWidth.value)
  } else if (currentViewMode.value === 'week') {
    deltaDays = Math.round(deltaX / cellWidth.value) * 7
  } else {
    // Vue mois - calculer en semaines pour plus de précision
    deltaDays = Math.round(deltaX / cellWidth.value) * 30
  }

  if (deltaDays === 0) return

  const task = dragState.task
  const start = new Date(task.start)
  const end = new Date(task.end)

  if (dragState.type === 'move') {
    start.setDate(start.getDate() + deltaDays)
    end.setDate(end.getDate() + deltaDays)
    task.start = formatDate(start)
    task.end = formatDate(end)
  } else if (dragState.type === 'resize') {
    if (dragState.handle === 'left') {
      start.setDate(start.getDate() + deltaDays)
      if (start < end) {
        task.start = formatDate(start)
      }
    } else {
      end.setDate(end.getDate() + deltaDays)
      if (end > start) {
        task.end = formatDate(end)
      }
    }
  }

  dragState.startX = event.clientX
}

async function handleDragEnd() {
  if (!dragState) return

  const task = dragState.task
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)

  // Sauvegarder les changements
  try {
    const { patch } = await import('@/services/api.js')

    if (task.type === 'sprint') {
      const sprintId = task.id.replace('sprint-', '')
      await patch(`/api/sprints/${sprintId}`, {
        startDate: task.start,
        endDate: task.end,
      })
    } else if (task.type === 'issue' || task.type === 'backlog-issue') {
      const issueId = task.id.replace('issue-', '').replace('backlog-issue-', '')
      await patch(`/api/issues/${issueId}`, {
        startDate: task.start,
        dueDate: task.end,
      })
    }

    emit('taskUpdated', { task, start: task.start, end: task.end })
  } catch (err) {
    console.error('Error updating task dates:', err)
    emit('error', err)
    await loadTimeline()
  }

  dragState = null
}

function handleScroll() {
  // Chargement infini - charger plus de dates quand on approche des bords
  if (!scrollContainer.value) return

  const scrollWidth = scrollContainer.value.scrollWidth
  const clientWidth = scrollContainer.value.clientWidth
  const scrollLeft = scrollContainer.value.scrollLeft

  // Si on scroll vers la gauche et on approche du début
  if (scrollLeft < clientWidth * 0.3 && !isPanning.value) {
    loadMoreDates('backward')
  }
  // Si on scroll vers la droite et on approche de la fin
  else if (scrollLeft > scrollWidth - clientWidth * 1.3 && !isPanning.value) {
    loadMoreDates('forward')
  }
}

function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function loadTimeline() {
  loading.value = true
  error.value = null

  try {
    const { get } = await import('@/services/api.js')
    const url = props.boardId ? `/api/timeline?boardId=${props.boardId}` : '/api/timeline'
    const response = await get(url)

    if (response && response.snapshot && response.snapshot.data) {
      const timelineData = response.snapshot.data
      tasks.value = convertToGanttTasks(timelineData)
      // Initialiser la vue seulement si c'est le premier chargement
      if (viewStartDate.value.getTime() === new Date().setHours(0, 0, 0, 0)) {
        initializeViewDate()
      }
    } else {
      tasks.value = []
    }
  } catch (err) {
    console.error('Error loading timeline:', err)
    error.value = err.message || 'Erreur lors du chargement de la chronologie'
    emit('error', err)
  } finally {
    loading.value = false
  }
}

function convertToGanttTasks(timelineData) {
  const ganttTasks = []

  if (timelineData.sprints && timelineData.sprints.length > 0) {
    timelineData.sprints.forEach((sprint) => {
      const sprintStart = sprint.startDate ? new Date(sprint.startDate) : new Date()
      const sprintEnd = sprint.endDate
        ? new Date(sprint.endDate)
        : new Date(sprintStart.getTime() + 14 * 24 * 60 * 60 * 1000)

      ganttTasks.push({
        id: `sprint-${sprint._id}`,
        name: sprint.name || 'Sprint sans nom',
        start: formatDate(sprintStart),
        end: formatDate(sprintEnd),
        progress: calculateSprintProgress(sprint),
        type: 'sprint',
        originalData: sprint,
      })

      if (sprint.issues && sprint.issues.length > 0) {
        sprint.issues.forEach((issue) => {
          const issueStart = issue.startDate ? new Date(issue.startDate) : sprintStart
          const issueEnd = issue.dueDate
            ? new Date(issue.dueDate)
            : new Date(issueStart.getTime() + 3 * 24 * 60 * 60 * 1000)

          ganttTasks.push({
            id: `issue-${issue._id}`,
            name: `${issue.key || ''} ${issue.title || 'Issue sans titre'}`,
            start: formatDate(issueStart),
            end: formatDate(issueEnd),
            progress: issue.status === 'done' ? 100 : issue.status === 'in-progress' ? 50 : 0,
            type: 'issue',
            originalData: issue,
          })
        })
      }
    })
  }

  if (timelineData.backlog && timelineData.backlog.length > 0) {
    timelineData.backlog.forEach((issue) => {
      const now = new Date()
      const issueStart = issue.startDate ? new Date(issue.startDate) : now
      const issueEnd = issue.dueDate
        ? new Date(issue.dueDate)
        : new Date(issueStart.getTime() + 3 * 24 * 60 * 60 * 1000)

      ganttTasks.push({
        id: `backlog-issue-${issue._id}`,
        name: `[Backlog] ${issue.key || ''} ${issue.title || 'Issue sans titre'}`,
        start: formatDate(issueStart),
        end: formatDate(issueEnd),
        progress: issue.status === 'done' ? 100 : issue.status === 'in-progress' ? 50 : 0,
        type: 'backlog-issue',
        originalData: issue,
      })
    })
  }

  return ganttTasks
}

function calculateSprintProgress(sprint) {
  if (!sprint.issues || sprint.issues.length === 0) return 0
  const doneCount = sprint.issues.filter((i) => i.status === 'done').length
  return Math.round((doneCount / sprint.issues.length) * 100)
}

async function refreshTimeline() {
  loading.value = true

  try {
    const { post, get } = await import('@/services/api.js')
    const url = props.boardId ? `/api/timeline?boardId=${props.boardId}` : '/api/timeline'
    const response = await get(url)

    if (response && response.snapshot && response.snapshot._id) {
      await post(`/api/timeline/${response.snapshot._id}/refresh`, {})
    } else {
      await post('/api/timeline', { boardId: props.boardId })
    }

    await loadTimeline()
  } catch (err) {
    console.error('Error refreshing timeline:', err)
    error.value = 'Erreur lors du rafraîchissement'
    emit('error', err)
  } finally {
    loading.value = false
  }
}

// Navigation dans le temps
function handleWheel(event) {
  // Empêcher le scroll vertical par défaut
  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    event.preventDefault()

    // Convertir le scroll vertical en navigation temporelle
    const delta = event.deltaY
    const threshold = 100 // Seuil pour changer de période

    if (Math.abs(delta) > threshold) {
      if (delta > 0) {
        navigateForward()
      } else {
        navigateBackward()
      }
    }
  }
}

function startPan(event) {
  // Seulement pour le scroll horizontal (clic molette ou shift+clic)
  if (event.button === 1 || event.shiftKey) {
    event.preventDefault()
    isPanning.value = true
    panStartX.value = event.clientX
    panStartScrollLeft.value = scrollContainer.value.scrollLeft
    scrollContainer.value.style.cursor = 'grabbing'

    document.addEventListener('mousemove', handlePanMove)
    document.addEventListener('mouseup', stopPan)
  }
}

function handlePanMove(event) {
  if (!isPanning.value) return

  const deltaX = event.clientX - panStartX.value
  scrollContainer.value.scrollLeft = panStartScrollLeft.value - deltaX

  // Charger plus de dates si on approche du bord
  const scrollWidth = scrollContainer.value.scrollWidth
  const clientWidth = scrollContainer.value.clientWidth
  const scrollLeft = scrollContainer.value.scrollLeft

  if (scrollLeft < clientWidth * 0.2) {
    // Proche du début, charger des dates antérieures
    loadMoreDates('backward')
  } else if (scrollLeft > scrollWidth - clientWidth * 1.2) {
    // Proche de la fin, charger des dates futures
    loadMoreDates('forward')
  }
}

function stopPan() {
  isPanning.value = false
  if (scrollContainer.value) {
    scrollContainer.value.style.cursor = 'default'
  }
  document.removeEventListener('mousemove', handlePanMove)
  document.removeEventListener('mouseup', stopPan)
}

function loadMoreDates(direction) {
  const newDate = new Date(viewStartDate.value)

  if (direction === 'backward') {
    if (currentViewMode.value === 'day') {
      newDate.setDate(newDate.getDate() - numVisiblePeriods.value)
    } else if (currentViewMode.value === 'week') {
      newDate.setDate(newDate.getDate() - numVisiblePeriods.value * 7)
    } else {
      newDate.setMonth(newDate.getMonth() - numVisiblePeriods.value)
    }
    numVisiblePeriods.value = Math.min(numVisiblePeriods.value + 10, 100)
  } else {
    // Forward - juste étendre la plage
    numVisiblePeriods.value = Math.min(numVisiblePeriods.value + 10, 100)
    return
  }

  viewStartDate.value = newDate
}

function navigateBackward() {
  const newDate = new Date(viewStartDate.value)

  if (currentViewMode.value === 'day') {
    newDate.setDate(newDate.getDate() - Math.floor(numVisiblePeriods.value / 2))
  } else if (currentViewMode.value === 'week') {
    newDate.setDate(newDate.getDate() - Math.floor(numVisiblePeriods.value / 2) * 7)
  } else {
    newDate.setMonth(newDate.getMonth() - Math.floor(numVisiblePeriods.value / 2))
  }

  viewStartDate.value = newDate
}

function navigateForward() {
  const newDate = new Date(viewStartDate.value)

  if (currentViewMode.value === 'day') {
    newDate.setDate(newDate.getDate() + Math.floor(numVisiblePeriods.value / 2))
  } else if (currentViewMode.value === 'week') {
    newDate.setDate(newDate.getDate() + Math.floor(numVisiblePeriods.value / 2) * 7)
  } else {
    newDate.setMonth(newDate.getMonth() + Math.floor(numVisiblePeriods.value / 2))
  }

  viewStartDate.value = newDate
}

function goToToday() {
  const today = new Date()

  if (currentViewMode.value === 'day') {
    // Centrer la vue sur aujourd'hui
    today.setDate(today.getDate() - Math.floor(numVisiblePeriods.value / 2))
  } else if (currentViewMode.value === 'week') {
    // Aller au début de la semaine actuelle
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Lundi
    today.setDate(today.getDate() + diff - Math.floor(numVisiblePeriods.value / 2) * 7)
  } else {
    // Aller au début du mois actuel
    today.setDate(1)
    today.setMonth(today.getMonth() - Math.floor(numVisiblePeriods.value / 2))
  }

  viewStartDate.value = today
}

function initializeViewDate() {
  // Initialiser la vue en fonction des tâches existantes ou aujourd'hui
  if (tasks.value.length > 0) {
    let minDate = new Date()
    tasks.value.forEach((task) => {
      const start = new Date(task.start)
      if (start < minDate) minDate = start
    })

    if (currentViewMode.value === 'day') {
      minDate.setDate(minDate.getDate() - Math.floor(numVisiblePeriods.value / 3))
    } else if (currentViewMode.value === 'week') {
      minDate.setDate(minDate.getDate() - Math.floor(numVisiblePeriods.value / 3) * 7)
    } else {
      minDate.setMonth(minDate.getMonth() - Math.floor(numVisiblePeriods.value / 3))
    }

    viewStartDate.value = minDate
  } else {
    goToToday()
  }
}

watch(
  () => currentViewMode.value,
  () => {
    if (currentViewMode.value === 'day') {
      cellWidth.value = 40
      numVisiblePeriods.value = 30
    } else if (currentViewMode.value === 'week') {
      cellWidth.value = 120
      numVisiblePeriods.value = 20
    } else {
      cellWidth.value = 150
      numVisiblePeriods.value = 12
    }
    goToToday()
  },
)

watch(
  () => props.boardId,
  () => {
    loadTimeline()
  },
)

onMounted(() => {
  loadTimeline()
})

defineExpose({
  loadTimeline,
  refreshTimeline,
})
</script>

<style scoped>
.timeline-container {
  width: 100%;
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
}

.timeline-controls {
  display: flex;
  gap: 8px;
}

.view-mode-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-mode-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.view-mode-btn.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.timeline-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.today-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #374151;
}

.today-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.refresh-btn,
.retry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #374151;
}

.refresh-btn:hover,
.retry-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gantt-wrapper {
  flex: 1;
  overflow: hidden;
  background: #f9fafb;
  min-height: 0;
}

.gantt-scroll-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
  cursor: default;
  user-select: none;
}

.gantt-scroll-container:active {
  cursor: grabbing;
}

.gantt-header {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 2px solid #e5e7eb;
}

.gantt-sidebar {
  width: 250px;
  flex-shrink: 0;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  padding: 12px 16px;
}

.gantt-timeline-header {
  display: flex;
  flex: 1;
}

.gantt-date-cell {
  flex-shrink: 0;
  border-right: 1px solid #e5e7eb;
  text-align: center;
  padding: 8px 4px;
}

.date-main {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.date-sub {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
}

.date-extra {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 2px;
  font-style: italic;
}

.gantt-body {
  display: flex;
  flex-direction: column;
}

.gantt-row {
  display: flex;
  height: 50px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.gantt-row.row-even {
  background: #f9fafb;
}

.gantt-row:hover {
  background: #f3f4f6;
}

.task-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #374151;
}

.gantt-timeline-body {
  position: relative;
  display: flex;
  flex: 1;
}

.gantt-grid-cell {
  flex-shrink: 0;
  border-right: 1px solid #f3f4f6;
}

.gantt-bar-wrapper {
  position: absolute;
  height: 32px;
  top: 9px;
  cursor: move;
  user-select: none;
}

.gantt-bar {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.gantt-bar:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.gantt-bar.bar-sprint {
  background: #3b82f6;
  border: 1px solid #2563eb;
}

.gantt-bar.bar-issue.bar-todo {
  background: #94a3b8;
  border: 1px solid #64748b;
}

.gantt-bar.bar-issue.bar-in-progress {
  background: #f59e0b;
  border: 1px solid #d97706;
}

.gantt-bar.bar-issue.bar-done {
  background: #10b981;
  border: 1px solid #059669;
}

.gantt-bar.bar-backlog {
  background: transparent;
  border: 2px dashed #94a3b8;
}

.gantt-bar.bar-backlog.bar-in-progress {
  border-color: #f59e0b;
}

.gantt-bar.bar-backlog.bar-done {
  border-color: #10b981;
}

.gantt-bar-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px 0 0 4px;
  pointer-events: none;
}

.gantt-bar-label {
  position: relative;
  z-index: 1;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.gantt-bar.bar-backlog .gantt-bar-label {
  color: #374151;
  text-shadow: none;
}

.gantt-bar-handle {
  position: absolute;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: ew-resize;
  opacity: 0;
  transition: opacity 0.2s;
}

.gantt-bar-wrapper:hover .gantt-bar-handle {
  opacity: 1;
}

.handle-left {
  left: 0;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.2), transparent);
  border-radius: 4px 0 0 4px;
}

.handle-right {
  right: 0;
  background: linear-gradient(to left, rgba(0, 0, 0, 0.2), transparent);
  border-radius: 0 4px 4px 0;
}

.today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ef4444;
  z-index: 5;
  pointer-events: none;
}

.today-line::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -3px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
}

.loading-state,
.error-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #6b7280;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state p {
  color: #ef4444;
  margin-bottom: 16px;
  font-weight: 500;
}

.empty-state .empty-hint {
  font-size: 14px;
  margin-top: 8px;
  color: #9ca3af;
}
</style>
