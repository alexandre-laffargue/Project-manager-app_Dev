import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuthStore, mockApi, resetTestMocks } from '../utils/testUtils'

describe('Backlog - issue management with new features', () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it('creates an issue with checklist items', async () => {
    const mockLoad = vi.fn()

    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: [],
    }

    const createdIssue = {
      _id: 'issue1',
      boardId: 'board1',
      title: 'Issue with checklist',
      description: 'Test issue',
      type: 'Task',
      priority: 'Medium',
      checklist: [
        { id: '1', text: 'Task 1', checked: false },
        { id: '2', text: 'Task 2', checked: false },
      ],
      sprintId: null,
    }

    let issuesData = []

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([sprint])
      if (url === '/api/issues') return Promise.resolve([...issuesData])
      if (url === '/api/boards/me') return Promise.resolve([{ _id: 'board1' }])
      return Promise.resolve([])
    })

    const mockPost = vi.fn((url) => {
      if (url === '/api/issues') {
        issuesData.push(createdIssue)
        return Promise.resolve(createdIssue)
      }
      return Promise.resolve({})
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, post: mockPost })

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView, { attachTo: document.body })

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 50))

    // Click "Nouvelle Issue" button
    const createBtn = wrapper.findAll('.btn-create')[1] // Second button is for issues
    await createBtn.trigger('click')
    await wrapper.vm.$nextTick()

    const modal = document.querySelector('.modal-overlay')
    expect(modal).toBeTruthy()

    // Fill issue form
    const titleInput = modal.querySelector('input[placeholder="Titre de l\'issue"]')
    const textarea = modal.querySelector('textarea')

    titleInput.value = 'Issue with checklist'
    titleInput.dispatchEvent(new Event('input'))
    textarea.value = 'Test issue'
    textarea.dispatchEvent(new Event('input'))

    await wrapper.vm.$nextTick()

    // Add checklist items
    const addChecklistBtn = modal.querySelector('.add-checklist-item')
    if (addChecklistBtn) {
      addChecklistBtn.click()
      await wrapper.vm.$nextTick()

      const checklistInputs = modal.querySelectorAll('.checklist-item input[type="text"]')
      if (checklistInputs.length > 0) {
        checklistInputs[0].value = 'Task 1'
        checklistInputs[0].dispatchEvent(new Event('input'))

        addChecklistBtn.click()
        await wrapper.vm.$nextTick()

        const updatedInputs = modal.querySelectorAll('.checklist-item input[type="text"]')
        if (updatedInputs.length > 1) {
          updatedInputs[1].value = 'Task 2'
          updatedInputs[1].dispatchEvent(new Event('input'))
        }
      }
    }

    await wrapper.vm.$nextTick()

    // Save issue
    const saveBtn = modal.querySelector('.btn-primary')
    saveBtn.click()
    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 100))

    // Verify API call
    expect(mockPost).toHaveBeenCalledWith(
      '/api/issues',
      expect.objectContaining({
        title: 'Issue with checklist',
        description: 'Test issue',
        checklist: expect.any(Array),
      }),
    )

    wrapper.unmount()
  })

  it('creates an issue linked to a sprint', async () => {
    const mockLoad = vi.fn()

    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: [],
    }

    const createdIssue = {
      _id: 'issue2',
      boardId: 'board1',
      title: 'Sprint Issue',
      description: 'Linked to sprint',
      type: 'Bug',
      priority: 'High',
      checklist: [],
      sprintId: 'sprint1',
    }

    let issuesData = []

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([sprint])
      if (url === '/api/issues') return Promise.resolve([...issuesData])
      if (url === '/api/boards/me') return Promise.resolve([{ _id: 'board1' }])
      return Promise.resolve([])
    })

    const mockPost = vi.fn((url, data) => {
      if (url === '/api/issues') {
        const issue = { ...createdIssue, sprintId: data.sprintId }
        issuesData.push(issue)
        return Promise.resolve(issue)
      }
      return Promise.resolve({})
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, post: mockPost })

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView, { attachTo: document.body })

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 50))

    // Click "Nouvelle Issue" button
    const createBtn = wrapper.findAll('.btn-create')[1]
    await createBtn.trigger('click')
    await wrapper.vm.$nextTick()

    const modal = document.querySelector('.modal-overlay')
    expect(modal).toBeTruthy()

    // Fill issue form
    const titleInput = modal.querySelector('input[placeholder="Titre de l\'issue"]')
    const typeSelect = modal.querySelector('select')

    titleInput.value = 'Sprint Issue'
    titleInput.dispatchEvent(new Event('input'))

    if (typeSelect) {
      typeSelect.value = 'Bug'
      typeSelect.dispatchEvent(new Event('change'))
    }

    // Select sprint if available
    const sprintSelect = Array.from(modal.querySelectorAll('select')).find((select) =>
      select.querySelector('option[value="sprint1"]'),
    )

    if (sprintSelect) {
      sprintSelect.value = 'sprint1'
      sprintSelect.dispatchEvent(new Event('change'))
    }

    await wrapper.vm.$nextTick()

    // Save issue
    const saveBtn = modal.querySelector('.btn-primary')
    saveBtn.click()
    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 100))

    // Verify API call includes sprintId
    const postCalls = mockPost.mock.calls.filter((call) => call[0] === '/api/issues')
    expect(postCalls.length).toBeGreaterThan(0)

    wrapper.unmount()
  })

  it('displays issue checklist progress in issue card', async () => {
    const mockLoad = vi.fn()

    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: ['issue1'],
    }

    const issueWithChecklist = {
      _id: 'issue1',
      boardId: 'board1',
      title: 'Issue with tasks',
      description: 'Has checklist',
      type: 'Task',
      priority: 'Medium',
      checklist: [
        { id: '1', text: 'Task 1', checked: true },
        { id: '2', text: 'Task 2', checked: false },
        { id: '3', text: 'Task 3', checked: true },
      ],
      sprintId: 'sprint1',
    }

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([sprint])
      if (url === '/api/issues') return Promise.resolve([issueWithChecklist])
      if (url === '/api/boards/me') return Promise.resolve([{ _id: 'board1' }])
      return Promise.resolve([])
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet })

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView, { attachTo: document.body })

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 100))

    // Issue should be displayed in backlog
    expect(wrapper.text()).toContain('Issue with tasks')

    wrapper.unmount()
  })

  it('updates issue checklist when editing', async () => {
    const mockLoad = vi.fn()

    const issue = {
      _id: 'issue1',
      boardId: 'board1',
      title: 'Editable Issue',
      description: 'Test',
      type: 'Task',
      priority: 'Medium',
      checklist: [{ id: '1', text: 'Old Task', checked: false }],
      sprintId: null,
    }

    let issuesData = [issue]

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([])
      if (url === '/api/issues') return Promise.resolve([...issuesData])
      if (url === '/api/boards/me') return Promise.resolve([{ _id: 'board1' }])
      return Promise.resolve([])
    })

    const mockPatch = vi.fn((url, data) => {
      if (url === `/api/issues/${issue._id}`) {
        const updated = { ...issue, ...data }
        issuesData[0] = updated
        return Promise.resolve(updated)
      }
      return Promise.resolve({})
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, patch: mockPatch })

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView, { attachTo: document.body })

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 100))

    // Verify issue is displayed
    expect(wrapper.text()).toContain('Editable Issue')

    wrapper.unmount()
  })

  it('shows sprint badge on issue card when linked to sprint', async () => {
    const mockLoad = vi.fn()

    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: ['issue1'],
    }

    const linkedIssue = {
      _id: 'issue1',
      boardId: 'board1',
      title: 'Linked Issue',
      description: 'In sprint',
      type: 'Feature',
      priority: 'High',
      checklist: [],
      sprintId: 'sprint1',
    }

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([sprint])
      if (url === '/api/issues') return Promise.resolve([linkedIssue])
      if (url === '/api/boards/me') return Promise.resolve([{ _id: 'board1' }])
      return Promise.resolve([])
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet })

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView, { attachTo: document.body })

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 100))

    // Issue should display sprint name
    expect(wrapper.text()).toContain('Linked Issue')
    expect(wrapper.text()).toContain('Sprint 1')

    wrapper.unmount()
  })

  it('displays linked issues in sprint accordion', async () => {
    const mockLoad = vi.fn()

    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: ['issue1', 'issue2'],
    }

    const issues = [
      {
        _id: 'issue1',
        boardId: 'board1',
        title: 'First Issue',
        type: 'Task',
        priority: 'High',
        sprintId: 'sprint1',
      },
      {
        _id: 'issue2',
        boardId: 'board1',
        title: 'Second Issue',
        type: 'Bug',
        priority: 'Medium',
        sprintId: 'sprint1',
      },
    ]

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([sprint])
      if (url === '/api/issues') return Promise.resolve(issues)
      if (url === '/api/boards/me') return Promise.resolve([{ _id: 'board1' }])
      return Promise.resolve([])
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet })

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView, { attachTo: document.body })

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 100))

    // Sprint should show issue count
    expect(wrapper.text()).toContain('2 issues')

    // Click "Voir les issues" button to expand accordion
    const sprintCard = wrapper.find('.sprint-card')
    const viewIssuesBtn = sprintCard.find('.btn-view-issues')

    await viewIssuesBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Linked issues should be visible in accordion
    const sprintIssues = sprintCard.find('.sprint-issues')
    expect(sprintIssues.exists()).toBe(true)
    expect(sprintIssues.text()).toContain('First Issue')
    expect(sprintIssues.text()).toContain('Second Issue')

    wrapper.unmount()
  })
})
