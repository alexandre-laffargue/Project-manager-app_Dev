<template>
  <div class="gantt-container">
    <!-- Loading State -->
    <div v-if="loading && tasks.length === 0" class="gantt-state">
      <div class="loading-spinner"></div>
      <p>Chargement de la chronologie...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="gantt-state gantt-error">
      <p>{{ error }}</p>
      <button @click="$emit('reload')" class="btn-retry">Réessayer</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="tasks.length === 0" class="gantt-state gantt-empty">
      <p>Aucune tâche dans cette chronologie</p>
      <button @click="$emit('openSelector')" class="btn-select-items">
        Sélectionner des éléments
      </button>
    </div>

    <!-- Gantt Chart (Flex Layout) -->
    <div
      v-else
      class="gantt-scroll-area"
      ref="scrollContainer"
      @wheel="handleWheel"
      @scroll="handleScroll"
    >
      <div class="gantt-content">
        <!-- Header Row -->
        <div class="gantt-row header-row">
          <div class="gantt-corner">Tâche</div>
          <div class="gantt-header-timeline" :style="{ width: totalWidth + 'px' }">
            <div
              v-for="cell in dateHeaders"
              :key="cell.key"
              class="gantt-header-cell"
              :style="{ width: cell.width + 'px', left: cell.left + 'px' }"
              :class="{ 'is-today': cell.isToday }"
            >
              <div class="date-main">{{ cell.main }}</div>
              <div class="date-sub">{{ cell.sub }}</div>
            </div>
          </div>
        </div>

        <!-- Task Rows -->
        <div v-for="(task, index) in tasks" :key="task.id" class="gantt-row task-row">
          <!-- Sidebar Cell -->
          <div class="gantt-sidebar-cell" :class="{ 'row-even': index % 2 === 0 }">
            <div class="task-info">
              <span class="task-badge" :class="task.type">{{ getTaskTypeBadge(task.type) }}</span>
              <span class="task-name" :title="task.name">{{ task.name }}</span>
            </div>
          </div>

          <!-- Timeline Cell -->
          <div
            class="gantt-timeline-cell"
            :class="{ 'row-even': index % 2 === 0 }"
            :style="{ width: totalWidth + 'px' }"
          >
            <!-- Grid Lines -->
            <div class="gantt-grid-lines">
              <div
                v-for="cell in dateHeaders"
                :key="'grid-' + cell.key"
                class="gantt-grid-line"
                :style="{ width: cell.width + 'px', left: cell.left + 'px' }"
                :class="{ 'is-today': cell.isToday, 'is-weekend': cell.isWeekend }"
              ></div>
            </div>

            <!-- Task Bar -->
            <div
              class="gantt-bar"
              :style="getBarStyle(task)"
              @mousedown.stop="startDrag($event, task)"
              :class="['bar-' + task.type, { 'is-dragging': dragState?.taskId === task.id }]"
            >
              <div class="bar-content">{{ task.name }}</div>
              <div
                class="bar-handle handle-left"
                @mousedown.stop="startResize($event, task, 'left')"
              ></div>
              <div
                class="bar-handle handle-right"
                @mousedown.stop="startResize($event, task, 'right')"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  viewMode: { type: String, default: 'day' },
  zoom: { type: Number, default: 1 },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
})

const emit = defineEmits(['reload', 'taskUpdated', 'openSelector'])

function parseDate(dateStr) {
  if (!dateStr) return null
  const datePart = dateStr.split('T')[0]
  const [year, month, day] = datePart.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatDate(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTodayUTC() {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return weekNo
}

const scrollContainer = ref(null)
const pixelsPerDay = computed(() => {
  if (props.viewMode === 'day') return 50 * props.zoom
  if (props.viewMode === 'week') return 20 * props.zoom
  return 5 * props.zoom
})

const dynamicStart = ref(null)
const dynamicEnd = ref(null)
const isExpanding = ref(false)

const dateRange = computed(() => {
  if (dynamicStart.value && dynamicEnd.value) {
    return { start: dynamicStart.value, end: dynamicEnd.value }
  }
  const today = getTodayUTC()
  return {
    start: new Date(today.getTime() - 30 * 86400000),
    end: new Date(today.getTime() + 30 * 86400000),
  }
})

function initRange() {
  const today = getTodayUTC()
  let min = new Date(today.getTime() - 90 * 86400000)
  let max = new Date(today.getTime() + 90 * 86400000)

  if (props.tasks.length > 0) {
    props.tasks.forEach((t) => {
      const s = parseDate(t.start)
      const e = parseDate(t.end)
      if (s && s < min) min = new Date(s.getTime() - 30 * 86400000)
      if (e && e > max) max = new Date(e.getTime() + 30 * 86400000)
    })
  }
  dynamicStart.value = min
  dynamicEnd.value = max
}

watch(
  () => props.tasks,
  () => {
    if (dragState.value && dragState.value.isWaiting) {
      dragState.value = null
    }

    if (!dynamicStart.value || !dynamicEnd.value) {
      initRange()
      return
    }
    let changed = false
    let min = dynamicStart.value
    let max = dynamicEnd.value

    props.tasks.forEach((t) => {
      const s = parseDate(t.start)
      const e = parseDate(t.end)
      if (s && s < min) {
        min = new Date(s.getTime() - 30 * 86400000)
        changed = true
      }
      if (e && e > max) {
        max = new Date(e.getTime() + 30 * 86400000)
        changed = true
      }
    })

    if (changed) {
      const oldStart = dynamicStart.value
      dynamicStart.value = min
      dynamicEnd.value = max

      if (min < oldStart) {
        const diffDays = (oldStart - min) / 86400000
        const addedWidth = diffDays * pixelsPerDay.value
        nextTick(() => {
          if (scrollContainer.value) scrollContainer.value.scrollLeft += addedWidth
        })
      }
    }
  },
  { deep: true },
)

function handleScroll() {
  if (isExpanding.value) return

  const el = scrollContainer.value
  if (!el) return

  const threshold = 1000
  const expandDays = 30

  if (el.scrollLeft < threshold) {
    isExpanding.value = true
    const oldStart = dynamicStart.value
    const newStart = new Date(oldStart.getTime() - expandDays * 86400000)
    dynamicStart.value = newStart

    const addedWidth = expandDays * pixelsPerDay.value

    nextTick(() => {
      el.scrollLeft += addedWidth
      setTimeout(() => {
        isExpanding.value = false
      }, 50)
    })
  } else if (el.scrollWidth - (el.scrollLeft + el.clientWidth) < threshold) {
    isExpanding.value = true
    const oldEnd = dynamicEnd.value
    const newEnd = new Date(oldEnd.getTime() + expandDays * 86400000)
    dynamicEnd.value = newEnd

    nextTick(() => {
      setTimeout(() => {
        isExpanding.value = false
      }, 50)
    })
  }
}

const totalDays = computed(() => {
  const diff = dateRange.value.end - dateRange.value.start
  return Math.ceil(diff / 86400000)
})

const totalWidth = computed(() => totalDays.value * pixelsPerDay.value)

const dateHeaders = computed(() => {
  const headers = []
  const start = dateRange.value.start
  const end = dateRange.value.end
  const today = getTodayUTC().getTime()

  if (props.viewMode === 'day') {
    for (let i = 0; i < totalDays.value; i++) {
      const d = new Date(start.getTime() + i * 86400000)
      const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6
      const isToday = d.getTime() === today

      headers.push({
        key: i,
        left: i * pixelsPerDay.value,
        width: pixelsPerDay.value,
        main: d.getUTCDate(),
        sub: d.toLocaleString('fr-FR', { month: 'short', timeZone: 'UTC' }),
        isWeekend,
        isToday,
        date: d,
      })
    }
  } else if (props.viewMode === 'week') {
    let current = new Date(start)
    const day = current.getUTCDay()
    const diff = current.getUTCDate() - day + (day === 0 ? -6 : 1)

    const firstMonday = new Date(current)
    firstMonday.setUTCDate(diff)

    current = firstMonday

    while (current < end) {
      const weekStart = new Date(current)
      const weekEnd = new Date(current.getTime() + 6 * 86400000)

      const left = ((weekStart - start) / 86400000) * pixelsPerDay.value
      const width = 7 * pixelsPerDay.value

      if (left + width > 0) {
        headers.push({
          key: weekStart.getTime(),
          left,
          width,
          main: `Sem ${getWeekNumber(weekStart)}`,
          sub: `${weekStart.getUTCDate()}/${weekStart.getUTCMonth() + 1} - ${weekEnd.getUTCDate()}/${weekEnd.getUTCMonth() + 1}`,
          isToday: today >= weekStart.getTime() && today <= weekEnd.getTime(),
        })
      }

      current = new Date(current.getTime() + 7 * 86400000)
    }
  } else if (props.viewMode === 'month') {
    let current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))

    while (current < end) {
      const monthStart = new Date(current)
      const nextMonth = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1))
      const daysInMonth = (nextMonth - monthStart) / 86400000

      const left = ((monthStart - start) / 86400000) * pixelsPerDay.value
      const width = daysInMonth * pixelsPerDay.value

      if (left + width > 0) {
        headers.push({
          key: monthStart.getTime(),
          left,
          width,
          main: monthStart.toLocaleString('fr-FR', { month: 'long', timeZone: 'UTC' }),
          sub: monthStart.getUTCFullYear(),
          isToday: today >= monthStart.getTime() && today < nextMonth.getTime(),
        })
      }

      current = nextMonth
    }
  }

  return headers
})

function getBarStyle(task) {
  const start = parseDate(task.start)
  const end = parseDate(task.end)
  const rangeStart = dateRange.value.start

  if (!start || !end) return { display: 'none' }

  const startDiff = (start - rangeStart) / 86400000
  const duration = (end - start) / 86400000

  if (dragState.value && dragState.value.taskId === task.id) {
    return {
      left: dragState.value.currentLeft + 'px',
      width: dragState.value.currentWidth + 'px',
      zIndex: 100,
    }
  }

  return {
    left: startDiff * pixelsPerDay.value + 'px',
    width: duration * pixelsPerDay.value + 'px',
  }
}

function getTaskTypeBadge(type) {
  const map = { sprint: 'SPRINT', issue: 'TASK', 'backlog-issue': 'BACKLOG' }
  return map[type] || type
}

const dragState = ref(null)

function startDrag(e, task) {
  if (e.button !== 0) return
  const start = parseDate(task.start)
  const end = parseDate(task.end)
  const rangeStart = dateRange.value.start
  const startDiff = (start - rangeStart) / 86400000
  const duration = (end - start) / 86400000
  const left = startDiff * pixelsPerDay.value
  const width = duration * pixelsPerDay.value

  dragState.value = {
    taskId: task.id,
    type: 'move',
    startX: e.clientX,
    originalLeft: left,
    currentLeft: left,
    currentWidth: width,
    originalStart: start,
    originalEnd: end,
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

function startResize(e, task, handle) {
  e.stopPropagation()
  if (e.button !== 0) return

  const start = parseDate(task.start)
  const end = parseDate(task.end)
  const rangeStart = dateRange.value.start
  const startDiff = (start - rangeStart) / 86400000
  const duration = (end - start) / 86400000
  const left = startDiff * pixelsPerDay.value
  const width = duration * pixelsPerDay.value

  dragState.value = {
    taskId: task.id,
    type: handle === 'left' ? 'resize-left' : 'resize-right',
    startX: e.clientX,
    originalLeft: left,
    originalWidth: width,
    currentLeft: left,
    currentWidth: width,
    originalStart: start,
    originalEnd: end,
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(e) {
  if (!dragState.value) return
  const dx = e.clientX - dragState.value.startX

  if (dragState.value.type === 'move') {
    dragState.value.currentLeft = dragState.value.originalLeft + dx
  } else if (dragState.value.type === 'resize-right') {
    dragState.value.currentWidth = Math.max(pixelsPerDay.value, dragState.value.originalWidth + dx)
  } else if (dragState.value.type === 'resize-left') {
    const newWidth = Math.max(pixelsPerDay.value, dragState.value.originalWidth - dx)
    const newLeft = dragState.value.originalLeft + (dragState.value.originalWidth - newWidth)
    dragState.value.currentLeft = newLeft
    dragState.value.currentWidth = newWidth
  }
}

function handleMouseUp() {
  if (!dragState.value) return

  const rangeStart = dateRange.value.start
  const daysOffset = Math.round(dragState.value.currentLeft / pixelsPerDay.value)
  const durationDays = Math.round(dragState.value.currentWidth / pixelsPerDay.value)

  const newStart = new Date(rangeStart.getTime() + daysOffset * 86400000)
  const newEnd = new Date(newStart.getTime() + durationDays * 86400000)

  const task = props.tasks.find((t) => t.id === dragState.value.taskId)
  if (task) {
    if (formatDate(newStart) !== task.start || formatDate(newEnd) !== task.end) {
      dragState.value.isWaiting = true
      emit('taskUpdated', task, formatDate(newStart), formatDate(newEnd))
    } else {
      dragState.value = null
    }
  } else {
    dragState.value = null
  }

  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

watch(
  () => props.viewMode,
  () => {
    nextTick(() => {
      scrollToFirstTask()
    })
  },
)

function scrollToFirstTask() {
  if (!props.tasks || props.tasks.length === 0) {
    goToToday()
    return
  }

  let minDate = null
  props.tasks.forEach((t) => {
    const s = parseDate(t.start)
    if (s) {
      if (!minDate || s < minDate) minDate = s
    }
  })

  if (minDate) {
    scrollToDate(minDate, 'left')
  } else {
    goToToday()
  }
}

function scrollToDate(dateInput, align = 'center') {
  if (!scrollContainer.value) return

  let targetDate
  if (dateInput instanceof Date) {
    targetDate = dateInput
  } else {
    targetDate = parseDate(dateInput)
  }

  if (!targetDate) return

  const rangeStart = dateRange.value.start
  const diff = (targetDate - rangeStart) / 86400000
  const left = diff * pixelsPerDay.value

  if (align === 'center') {
    scrollContainer.value.scrollLeft = left - scrollContainer.value.clientWidth / 2
  } else {
    scrollContainer.value.scrollLeft = Math.max(0, left - 50)
  }
}

function goToToday() {
  scrollToDate(getTodayUTC())
}

function handleWheel(event) {
  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    if (!event.shiftKey) {
      event.preventDefault()
      scrollContainer.value.scrollLeft += event.deltaY
    }
  } else {
    if (event.shiftKey) {
      event.preventDefault()
      scrollContainer.value.scrollTop += event.deltaX
    }
  }
}

defineExpose({
  scrollToDate,
  goToToday,
  scrollToFirstTask,
})

onMounted(() => {
  initRange()
  setTimeout(() => {
    scrollToFirstTask()
  }, 100)
})
</script>

<style scoped>
.gantt-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.gantt-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}

.gantt-scroll-area {
  flex: 1;
  overflow: auto;
  position: relative;
}

.gantt-content {
  display: flex;
  flex-direction: column;
  width: max-content;
  min-width: 100%;
}

.gantt-row {
  display: flex;
}

/* Header */
.header-row {
  position: sticky;
  top: 0;
  z-index: 40;
  background: #fff;
}

.gantt-corner {
  position: sticky;
  left: 0;
  z-index: 50;
  width: 300px;
  flex-shrink: 0;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  height: 60px;
  display: flex;
  align-items: center;
  padding-left: 16px;
  font-weight: 600;
  color: #374151;
  box-sizing: border-box;
}

.gantt-header-timeline {
  position: relative;
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.gantt-header-cell {
  position: absolute;
  top: 0;
  bottom: 0;
  border-right: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-sizing: border-box;
}

.gantt-header-cell.is-today {
  background: rgba(251, 191, 36, 0.1);
  color: #d97706;
  font-weight: bold;
}

/* Task Rows */
.gantt-sidebar-cell {
  position: sticky;
  left: 0;
  z-index: 30;
  width: 300px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
}

.gantt-sidebar-cell.row-even {
  background: #f9fafb;
}

.gantt-timeline-cell {
  position: relative;
  height: 56px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  flex-shrink: 0;
}

.gantt-timeline-cell.row-even {
  background: #f9fafb;
}

/* Grid Lines */
.gantt-grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.gantt-grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  border-right: 1px solid #f3f4f6;
  box-sizing: border-box;
}

.gantt-grid-line.is-weekend {
  background: #fcfcfc;
}

.gantt-grid-line.is-today {
  background: rgba(251, 191, 36, 0.05);
}

/* Bars */
.gantt-bar {
  position: absolute;
  top: 8px;
  bottom: 8px;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  overflow: hidden;
  white-space: nowrap;
  cursor: grab;
  z-index: 20;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.gantt-bar.is-dragging {
  opacity: 0.8;
  cursor: grabbing;
  z-index: 60;
}

.bar-sprint {
  background: #7c3aed;
  border: 1px solid #6d28d9;
  box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);
  font-weight: 600;
  z-index: 6; /* Higher than tasks */
}
.bar-issue {
  background: #3b82f6;
}
.bar-backlog-issue {
  background: #6b7280;
}

.btn-select-items {
  margin-top: 16px;
  padding: 10px 20px;
  background: #7b5fc0;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-select-items:hover {
  background: #a07ff0;
  transform: translateY(-2px);
}

.task-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 8px;
  background: #e5e7eb;
  color: #374151;
}

.task-name {
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Handles */
.bar-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  opacity: 0;
}
.gantt-bar:hover .bar-handle {
  opacity: 1;
}
.handle-left {
  left: 0;
  background: rgba(0, 0, 0, 0.1);
}
.handle-right {
  right: 0;
  background: rgba(0, 0, 0, 0.1);
}
</style>
