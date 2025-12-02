import { ref, computed } from 'vue'
import { get, post, patch, del } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export function useTimeline() {
  const auth = useAuthStore()
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const error = ref(null)

  // Liste des timelines
  const timelines = ref([])
  const currentTimeline = ref(null)
  const tasks = ref([])
  const currentBoardId = ref(null)

  // Modals
  const showCreateTimelineModal = ref(false)
  const showEditTimelineModal = ref(false)
  const showItemsSelectorModal = ref(false)
  const editingTimeline = ref(null)

  // Items for selection
  const sprints = ref([])
  const issues = ref([])
  const selectedSprints = ref([])
  const selectedIssues = ref([])

  // Configuration du Gantt
  const viewMode = ref('day') // 'day', 'week', 'month'
  const zoom = ref(1) // Niveau de zoom

  async function ensureBoardExists() {
    if (currentBoardId.value) return currentBoardId.value

    try {
      const boards = await get('/api/boards/me')
      let board = (boards && boards[0]) || null
      if (!board) {
        board = await post('/api/boards', { name: 'Mon tableau' })
      }
      currentBoardId.value = board._id
      return board._id
    } catch (err) {
      console.error('useTimeline: failed to ensure board exists', err)
      throw err
    }
  }

  async function loadSprintsAndIssues() {
    if (!isAuthenticated.value) return

    try {
      const bId = await ensureBoardExists()
      if (!bId) return

      // Load sprints
      const sprintsResponse = await get('/api/sprints', { boardId: bId })
      sprints.value = Array.isArray(sprintsResponse) ? sprintsResponse : []

      // Load issues
      const issuesResponse = await get('/api/issues', { boardId: bId })
      issues.value = Array.isArray(issuesResponse) ? issuesResponse : []
    } catch (err) {
      console.error('Error loading sprints and issues:', err)
    }
  }

  async function loadTimelines() {
    loading.value = true
    error.value = null

    try {
      auth.loadFromStorage()
      isAuthenticated.value = !!auth.token

      if (!isAuthenticated.value) {
        error.value = 'Vous devez être connecté pour accéder à la chronologie'
        return
      }

      const bId = await ensureBoardExists()

      const response = await get(`/api/timeline?boardId=${bId}`)

      if (response) {
        if (Array.isArray(response)) {
          timelines.value = response
        } else if (response.snapshot) {
          timelines.value = [response.snapshot]
        } else {
          timelines.value = []
        }

        if (timelines.value.length > 0) {
          const stillExists =
            currentTimeline.value &&
            timelines.value.find((t) => t._id === currentTimeline.value._id)

          if (!stillExists) {
            selectTimeline(timelines.value[0])
          } else {
            const refreshedTimeline = timelines.value.find(
              (t) => t._id === currentTimeline.value._id,
            )
            selectTimeline(refreshedTimeline)
          }
        }
      } else {
        timelines.value = []
      }

      await loadSprintsAndIssues()

      if (
        currentTimeline.value &&
        (!currentTimeline.value.data || Object.keys(currentTimeline.value.data).length === 0)
      ) {
        await refreshTimeline()
      }
    } catch (err) {
      console.error('useTimeline: failed to load timelines', err)
      error.value = err.message || 'Erreur lors du chargement des chronologies'
    } finally {
      loading.value = false
    }
  }

  function selectTimeline(timeline) {
    currentTimeline.value = timeline
    if (timeline && timeline.data) {
      tasks.value = convertToGanttTasks(timeline.data)

      // Load selected items from timeline metadata
      selectedSprints.value = timeline.selectedSprints || []
      selectedIssues.value = timeline.selectedIssues || []
    } else {
      tasks.value = []
      selectedSprints.value = []
      selectedIssues.value = []
    }
  }

  async function createTimeline(formData) {
    loading.value = true
    error.value = null

    try {
      const bId = await ensureBoardExists()

      const payload = {
        boardId: bId,
        name: formData.name || 'Nouvelle chronologie',
        selectedSprints: formData.selectedSprints || [],
        selectedIssues: formData.selectedIssues || [],
      }

      const created = await post('/api/timeline', payload)

      if (created && created.snapshot) {
        timelines.value.push(created.snapshot)
        selectTimeline(created.snapshot)

        // Refresh to populate data
        await refreshTimeline()
      }

      showCreateTimelineModal.value = false
    } catch (err) {
      console.error('useTimeline: failed to create timeline', err)
      error.value = err.message || 'Erreur lors de la création de la chronologie'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTimeline(timelineId, formData) {
    loading.value = true
    error.value = null

    try {
      const payload = {}
      if (formData.name !== undefined) payload.name = formData.name
      if (formData.selectedSprints !== undefined) payload.selectedSprints = formData.selectedSprints
      if (formData.selectedIssues !== undefined) payload.selectedIssues = formData.selectedIssues

      const updated = await patch(`/api/timeline/${timelineId}`, payload)

      if (updated && updated.snapshot) {
        const index = timelines.value.findIndex((t) => t._id === timelineId)
        if (index !== -1) {
          timelines.value[index] = updated.snapshot
          if (currentTimeline.value?._id === timelineId) {
            currentTimeline.value = updated.snapshot
          }
        }
      }

      showEditTimelineModal.value = false
      editingTimeline.value = null
    } catch (err) {
      console.error('useTimeline: failed to update timeline', err)
      error.value = err.message || 'Erreur lors de la mise à jour de la chronologie'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTimeline(timeline) {
    loading.value = true
    error.value = null

    try {
      await del(`/api/timeline/${timeline._id}`)

      const index = timelines.value.findIndex((t) => t._id === timeline._id)
      if (index !== -1) {
        timelines.value.splice(index, 1)
      }

      if (currentTimeline.value?._id === timeline._id) {
        currentTimeline.value = timelines.value[0] || null
        if (currentTimeline.value) {
          selectTimeline(currentTimeline.value)
        } else {
          tasks.value = []
        }
      }
    } catch (err) {
      console.error('useTimeline: failed to delete timeline', err)
      error.value = err.message || 'Erreur lors de la suppression de la chronologie'
      throw err
    } finally {
      loading.value = false
    }
  }

  function openEditTimelineModal(timeline) {
    editingTimeline.value = timeline
    showEditTimelineModal.value = true
  }

  function closeEditTimelineModal() {
    showEditTimelineModal.value = false
    editingTimeline.value = null
  }

  function openItemsSelector() {
    showItemsSelectorModal.value = true
  }

  function closeItemsSelector() {
    showItemsSelectorModal.value = false
  }

  async function saveSelectedItems(selection) {
    if (!currentTimeline.value) return

    loading.value = true
    try {
      selectedSprints.value = selection.sprints
      selectedIssues.value = selection.issues

      const updated = await patch(`/api/timeline/${currentTimeline.value._id}`, {
        selectedSprints: selection.sprints,
        selectedIssues: selection.issues,
      })

      if (updated && updated.snapshot) {
        const index = timelines.value.findIndex((t) => t._id === currentTimeline.value._id)
        if (index !== -1) {
          timelines.value[index] = updated.snapshot
        }
        currentTimeline.value = updated.snapshot
      }

      await refreshTimeline()
      closeItemsSelector()
    } catch (err) {
      console.error('Error saving selected items:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refreshTimeline() {
    if (!currentTimeline.value) return

    loading.value = true
    error.value = null

    try {
      const refreshed = await post(`/api/timeline/${currentTimeline.value._id}/refresh`, {})

      if (refreshed && refreshed.snapshot) {
        const index = timelines.value.findIndex((t) => t._id === currentTimeline.value._id)
        if (index !== -1) {
          timelines.value[index] = refreshed.snapshot
        }
        selectTimeline(refreshed.snapshot)
      }
    } catch (err) {
      console.error('useTimeline: failed to refresh timeline', err)
      error.value = err.message || 'Erreur lors du rafraîchissement de la chronologie'
    } finally {
      loading.value = false
    }
  }

  async function updateTaskDates(task, newStart, newEnd) {
    try {
      if (task.type === 'sprint') {
        const sprintId = task.id.replace('sprint-', '')
        await patch(`/api/sprints/${sprintId}`, {
          startDate: newStart,
          endDate: newEnd,
        })
      } else if (task.type === 'issue' || task.type === 'backlog-issue') {
        let issueId = task.id
        if (task.id.startsWith('backlog-issue-')) {
          issueId = task.id.replace('backlog-issue-', '')
        } else if (task.id.startsWith('issue-')) {
          issueId = task.id.replace('issue-', '')
        }

        await patch(`/api/issues/${issueId}`, {
          startDate: newStart,
          endDate: newEnd,
        })
      }

      if (currentTimeline.value) {
        await refreshTimeline()
      }
    } catch (err) {
      console.error('useTimeline: failed to update task dates', err)
      error.value = err.message || 'Erreur lors de la mise à jour des dates'
      throw err
    }
  }

  function convertToGanttTasks(data) {
    const ganttTasks = []

    if (data.sprints && data.sprints.length > 0) {
      data.sprints.forEach((sprint) => {
        const sprintStart = sprint.startDate ? parseDate(sprint.startDate) : new Date()
        const sprintEnd = sprint.endDate
          ? parseDate(sprint.endDate)
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
            const issueStart = issue.startDate ? parseDate(issue.startDate) : sprintStart
            const issueEnd = issue.endDate
              ? parseDate(issue.endDate)
              : new Date(issueStart.getTime() + 3 * 24 * 60 * 60 * 1000)

            ganttTasks.push({
              id: `issue-${issue._id}`,
              name: `${issue.key || ''} ${issue.title || 'Issue sans titre'}`,
              start: formatDate(issueStart),
              end: formatDate(issueEnd),
              progress: getIssueProgress(issue),
              type: 'issue',
              originalData: issue,
            })
          })
        }
      })
    }

    if (data.backlog && data.backlog.length > 0) {
      data.backlog.forEach((issue) => {
        const now = new Date()
        const issueStart = issue.startDate ? new Date(issue.startDate) : now
        const issueEnd = issue.endDate
          ? new Date(issue.endDate)
          : new Date(issueStart.getTime() + 3 * 24 * 60 * 60 * 1000)

        const prefix = issue.sprintId ? '' : '[Backlog] '

        ganttTasks.push({
          id: `backlog-issue-${issue._id}`,
          name: `${prefix}${issue.key || ''} ${issue.title || 'Issue sans titre'}`,
          start: formatDate(issueStart),
          end: formatDate(issueEnd),
          progress: getIssueProgress(issue),
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

  function getIssueProgress(issue) {
    if (issue.status === 'done') return 100
    if (issue.status === 'in-progress') return 50
    return 0
  }

  // Helper pour parser les dates (Local Time)
  function parseDate(dateStr) {
    return dateStr ? new Date(dateStr) : null
  }

  function formatDate(date) {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const sortedTasks = computed(() => {
    return [...tasks.value].sort((a, b) => {
      const dateA = new Date(a.start)
      const dateB = new Date(b.start)
      return dateA - dateB
    })
  })

  return {
    isAuthenticated,
    loading,
    error,
    timelines,
    currentTimeline,
    tasks,
    sortedTasks,
    viewMode,
    zoom,
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
    openEditTimelineModal,
    closeEditTimelineModal,
    openItemsSelector,
    closeItemsSelector,
    saveSelectedItems,
    refreshTimeline,
    updateTaskDates,
  }
}
