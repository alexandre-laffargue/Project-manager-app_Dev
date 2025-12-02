import { ref, reactive } from 'vue'
import { get, post, patch, del } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export function useBacklog() {
  const auth = useAuthStore()
  const isAuthenticated = ref(false)

  const sprints = reactive([])
  const issues = reactive([])
  let currentBoardId = null

  // Modals de création
  const showCreateSprintModal = ref(false)
  const showCreateIssueModal = ref(false)

  // Modals d'édition
  const showEditSprintModal = ref(false)
  const showEditIssueModal = ref(false)
  const editingSprint = ref(null)
  const editingIssue = ref(null)

  async function loadBacklog() {
    try {
      auth.loadFromStorage()
      isAuthenticated.value = !!auth.token
      if (!isAuthenticated.value) return

      // Récupérer ou créer le board
      const boards = await get('/api/boards/me')
      let board = (boards && boards[0]) || null
      if (!board) {
        board = await post('/api/boards', { name: 'Mon tableau' })
      }
      currentBoardId = board._id

      // Charger les sprints
      const sprintsData = await get('/api/sprints')
      if (sprintsData) {
        sprints.splice(0, sprints.length)
        sprintsData.forEach((s) => sprints.push({ ...s, issues: s.issues || [] }))
      }

      // Charger les issues
      const issuesData = await get('/api/issues')
      if (issuesData) {
        issues.splice(0, issues.length)
        issuesData.forEach((i) => issues.push(i))
      }
    } catch (err) {
      console.error('useBacklog: failed to load backlog', err)
    }
  }

  async function createSprint(formData) {
    try {
      const created = await post('/api/sprints', {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        objective: formData.objective,
        issues: formData.issues || [],
      })
      sprints.push({
        _id: created._id || created.id || Date.now().toString(),
        name: created.name || formData.name,
        startDate: created.startDate || formData.startDate,
        endDate: created.endDate || formData.endDate,
        objective: created.objective || formData.objective,
        status: created.status || 'planned',
        issues: created.issues || [],
      })
      showCreateSprintModal.value = false
      // Recharger pour voir les issues liées mises à jour
      await loadBacklog()
    } catch (err) {
      console.error('Erreur lors de la création du sprint :', err)
      alert('Erreur lors de la création du sprint.')
    }
  }

  function openEditSprintModal(sprint) {
    editingSprint.value = sprint
    showEditSprintModal.value = true
  }

  function closeEditSprintModal() {
    showEditSprintModal.value = false
    editingSprint.value = null
  }

  async function saveEditSprint(formData) {
    try {
      const updated = await patch(`/api/sprints/${editingSprint.value._id}`, {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        objective: formData.objective,
        issues: formData.issues || [],
      })
      const sprint = sprints.find((s) => s._id === editingSprint.value._id)
      if (sprint) {
        sprint.name = updated.name
        sprint.startDate = updated.startDate
        sprint.endDate = updated.endDate
        sprint.objective = updated.objective
        sprint.issues = updated.issues || []
      }
      closeEditSprintModal()
      // Recharger pour voir les issues liées mises à jour
      await loadBacklog()
    } catch (err) {
      console.error('Erreur lors de la modification du sprint :', err)
      alert('Erreur lors de la modification du sprint.')
    }
  }

  async function deleteSprint(sprint) {
    if (!confirm(`Supprimer le sprint "${sprint.name}" ?`)) return
    try {
      await del(`/api/sprints/${sprint._id}`)
      const index = sprints.findIndex((s) => s._id === sprint._id)
      if (index !== -1) sprints.splice(index, 1)
    } catch (err) {
      console.error('Erreur lors de la suppression du sprint :', err)
      alert('Erreur lors de la suppression du sprint.')
    }
  }

  async function createIssue(formData) {
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        sprintId: formData.sprintId || null,
        checklist: formData.checklist || [],
        boardId: currentBoardId,
      }
      const created = await post('/api/issues', payload)
      issues.push({
        _id: created._id || created.id || Date.now().toString(),
        title: created.title || formData.title,
        description: created.description || formData.description,
        type: created.type || formData.type,
        priority: created.priority || formData.priority,
        sprintId: created.sprintId || null,
        checklist: created.checklist || [],
        boardId: created.boardId || currentBoardId,
      })
      showCreateIssueModal.value = false
      // Recharger pour voir les issues liées au sprint
      await loadBacklog()
    } catch (err) {
      console.error("Erreur lors de la création de l'issue :", err)
      alert("Erreur lors de la création de l'issue.")
    }
  }

  function openEditIssueModal(issue) {
    editingIssue.value = issue
    showEditIssueModal.value = true
  }

  function closeEditIssueModal() {
    showEditIssueModal.value = false
    editingIssue.value = null
  }

  async function saveEditIssue(formData) {
    try {
      const updated = await patch(`/api/issues/${editingIssue.value._id}`, {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        sprintId: formData.sprintId || null,
        checklist: formData.checklist || [],
      })
      const issue = issues.find((i) => i._id === editingIssue.value._id)
      if (issue) {
        issue.title = updated.title
        issue.description = updated.description
        issue.type = updated.type
        issue.priority = updated.priority
        issue.sprintId = updated.sprintId || null
        issue.checklist = updated.checklist || []
      }
      closeEditIssueModal()
      // Recharger pour voir les issues liées au sprint mises à jour
      await loadBacklog()
    } catch (err) {
      console.error("Erreur lors de la modification de l'issue :", err)
      alert("Erreur lors de la modification de l'issue.")
    }
  }

  async function deleteIssue(issue) {
    if (!confirm(`Supprimer l'issue "${issue.title}" ?`)) return
    try {
      await del(`/api/issues/${issue._id}`)
      const index = issues.findIndex((i) => i._id === issue._id)
      if (index !== -1) issues.splice(index, 1)
    } catch (err) {
      console.error("Erreur lors de la suppression de l'issue :", err)
      alert("Erreur lors de la suppression de l'issue.")
    }
  }

  async function startSprint(sprint) {
    try {
      const updated = await post(`/api/sprints/${sprint._id}/start`)
      const sprintInList = sprints.find((s) => s._id === sprint._id)
      if (sprintInList) {
        sprintInList.status = updated.status
        sprintInList.startDate = updated.startDate
      }
    } catch (err) {
      console.error('Erreur lors du démarrage du sprint :', err)
      alert('Erreur lors du démarrage du sprint.')
    }
  }

  async function closeSprint(sprint) {
    try {
      const updated = await post(`/api/sprints/${sprint._id}/close`)
      const sprintInList = sprints.find((s) => s._id === sprint._id)
      if (sprintInList) {
        sprintInList.status = updated.status
        sprintInList.endDate = updated.endDate
      }
    } catch (err) {
      console.error('Erreur lors de la clôture du sprint :', err)
      alert('Erreur lors de la clôture du sprint.')
    }
  }

  async function reopenSprint(sprint) {
    try {
      const updated = await post(`/api/sprints/${sprint._id}/reopen`)
      const sprintInList = sprints.find((s) => s._id === sprint._id)
      if (sprintInList) {
        sprintInList.status = updated.status
      }
    } catch (err) {
      console.error('Erreur lors de la réouverture du sprint :', err)
      alert('Erreur lors de la réouverture du sprint.')
    }
  }

  return {
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
    startSprint,
    closeSprint,
    reopenSprint,
    createIssue,
    openEditIssueModal,
    closeEditIssueModal,
    saveEditIssue,
    deleteIssue,
  }
}
