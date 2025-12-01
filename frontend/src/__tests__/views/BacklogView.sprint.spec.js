import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuthStore, mockApi, resetTestMocks } from '../utils/testUtils'

describe('Backlog - sprint creation', () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it('creates a sprint when user fills the form and clicks create', async () => {
    const mockLoad = vi.fn()

    const created = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Objectif test',
      issues: [],
    }

    let sprintsAfterCreate = []

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([...sprintsAfterCreate])
      if (url === '/api/issues') return Promise.resolve([])
      if (url === '/api/boards/me') return Promise.resolve([{ _id: 'board1' }])
      return Promise.resolve([])
    })

    const mockPost = vi.fn((url) => {
      if (url === '/api/sprints') {
        sprintsAfterCreate.push(created)
        return Promise.resolve(created)
      }
      return Promise.resolve({})
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, post: mockPost })

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView, { attachTo: document.body })

    // wait for onMounted loadBacklog
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 50))

    // Click "Nouveau Sprint" button to open modal
    const createBtn = wrapper.find('.btn-create')
    await createBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Find modal and fill form
    const modal = document.querySelector('.modal-overlay')
    expect(modal).toBeTruthy()

    const nameInput = modal.querySelector('input[placeholder="Nom du sprint"]')
    const dateInputs = modal.querySelectorAll('input[type="date"]')
    const textarea = modal.querySelector('textarea')

    nameInput.value = 'Sprint 1'
    nameInput.dispatchEvent(new Event('input'))
    dateInputs[0].value = '2025-11-20'
    dateInputs[0].dispatchEvent(new Event('input'))
    dateInputs[1].value = '2025-11-27'
    dateInputs[1].dispatchEvent(new Event('input'))
    textarea.value = 'Objectif test'
    textarea.dispatchEvent(new Event('input'))

    await wrapper.vm.$nextTick()

    // click save button in modal
    const saveBtn = modal.querySelector('.btn-primary')
    saveBtn.click()
    await wrapper.vm.$nextTick()

    // allow async createSprint to resolve and reload
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 100))

    expect(mockPost).toHaveBeenCalledWith(
      '/api/sprints',
      expect.objectContaining({
        name: 'Sprint 1',
        startDate: '2025-11-20',
        endDate: '2025-11-27',
        objective: 'Objectif test',
        issues: expect.any(Array),
      }),
    )

    // new sprint should appear in the DOM after reload
    expect(wrapper.text()).toContain('Sprint 1')

    wrapper.unmount()
  })

  it('edits a sprint using prompts and updates the DOM', async () => {
    const mockLoad = vi.fn()

    // no cards needed for sprint tests
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Old objective',
      issues: [],
    }

    const sprintsData = [sprint]

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([...sprintsData])
      if (url === '/api/issues') return Promise.resolve([])
      if (url === '/api/boards/me') return Promise.resolve([{ _id: 'board1' }])
      return Promise.resolve([])
    })

    const mockPatch = vi.fn((url, data) => {
      if (url === `/api/sprints/${sprint._id}`) {
        const updated = {
          ...sprint,
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          objective: data.objective,
          issues: data.issues || [],
        }
        sprintsData[0] = updated
        return Promise.resolve(updated)
      }
      return Promise.resolve({})
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, patch: mockPatch })

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView, { attachTo: document.body })

    // wait for load
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 100))

    // click Modifier on the sprint (opens modal)
    const actionBtns = wrapper.findAll('.sprint-card .sprint-actions button')
    expect(actionBtns.length).toBeGreaterThanOrEqual(2)
    await actionBtns[1].trigger('click') // Index 1 = Modifier button
    await wrapper.vm.$nextTick()

    // Fill modal form
    const modal = document.querySelector('.modal-overlay')
    expect(modal).toBeTruthy()

    const nameInput = modal.querySelector('input[placeholder="Nom du sprint"]')
    const dateInputs = modal.querySelectorAll('input[type="date"]')
    const textarea = modal.querySelector('textarea')

    nameInput.value = 'Sprint 1 - Updated'
    nameInput.dispatchEvent(new Event('input'))
    dateInputs[0].value = '2025-11-21'
    dateInputs[0].dispatchEvent(new Event('input'))
    dateInputs[1].value = '2025-11-28'
    dateInputs[1].dispatchEvent(new Event('input'))
    textarea.value = 'Updated objective'
    textarea.dispatchEvent(new Event('input'))

    await wrapper.vm.$nextTick()

    // Click save button
    const saveBtn = modal.querySelector('.btn-primary')
    saveBtn.click()
    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 100))

    expect(mockPatch).toHaveBeenCalledWith(
      `/api/sprints/${sprint._id}`,
      expect.objectContaining({
        name: 'Sprint 1 - Updated',
        startDate: '2025-11-21',
        endDate: '2025-11-28',
        objective: 'Updated objective',
        issues: expect.any(Array),
      }),
    )

    // DOM updated after reload
    expect(wrapper.text()).toContain('Sprint 1 - Updated')
    expect(wrapper.text()).toContain('Updated objective')

    wrapper.unmount()
  })

  it('does not call patch when prompts return invalid values (empty name)', async () => {
    const mockLoad = vi.fn()

    const sprint = {
      _id: 'sprint3',
      name: 'Sprint Keep',
      startDate: '2025-10-10',
      endDate: '2025-10-17',
      objective: 'Keep objective',
      issues: [],
    }

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([sprint])
      if (url === '/api/issues') return Promise.resolve([])
      if (url === '/api/boards/me') return Promise.resolve([{ _id: 'board1' }])
      return Promise.resolve([])
    })

    const mockPatch = vi.fn(() => Promise.resolve({}))

    // Mock alert to check if validation message appears
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, patch: mockPatch })

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView, { attachTo: document.body })

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 100))

    const actionBtns = wrapper.findAll('.sprint-card .sprint-actions button')
    expect(actionBtns.length).toBeGreaterThanOrEqual(2)
    await actionBtns[1].trigger('click') // Index 1 = Modifier button

    await wrapper.vm.$nextTick()

    // Fill modal with empty name
    const modal = document.querySelector('.modal-overlay')
    expect(modal).toBeTruthy()

    const nameInput = modal.querySelector('input[placeholder="Nom du sprint"]')
    nameInput.value = ''
    nameInput.dispatchEvent(new Event('input'))

    await wrapper.vm.$nextTick()

    // Try to save with empty name
    const saveBtn = modal.querySelector('.btn-primary')
    saveBtn.click()
    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 50))

    // Should show alert
    expect(alertSpy).toHaveBeenCalledWith('Le nom du sprint est obligatoire.')

    // Should NOT call patch
    expect(mockPatch).not.toHaveBeenCalled()

    // Sprint name should remain unchanged in DOM
    expect(wrapper.text()).toContain('Sprint Keep')

    alertSpy.mockRestore()
    wrapper.unmount()
  })

  it('deletes a sprint when confirmation accepted', async () => {
    const mockLoad = vi.fn()

    const sprint = {
      _id: 'sprint2',
      name: 'Sprint To Delete',
      startDate: '2025-11-01',
      endDate: '2025-11-07',
      objective: 'To be removed',
      issues: [],
    }

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([sprint])
      if (url === '/api/issues') return Promise.resolve([])
      if (url === '/api/boards/me') return Promise.resolve([{ _id: 'board1' }])
      return Promise.resolve([])
    })

    const mockDel = vi.fn(() => Promise.resolve())

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, del: mockDel })

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView, { attachTo: document.body })

    // wait for load
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 100))

    // click Supprimer (third button)
    const actionBtns = wrapper.findAll('.sprint-card .sprint-actions button')
    expect(actionBtns.length).toBeGreaterThanOrEqual(3)
    await actionBtns[2].trigger('click') // Index 2 = Supprimer button

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 50))

    expect(mockDel).toHaveBeenCalledWith(`/api/sprints/${sprint._id}`)
    expect(wrapper.text()).not.toContain('Sprint To Delete')

    confirmSpy.mockRestore()
    wrapper.unmount()
  })
})
