import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuthStore, mockApi, resetTestMocks } from '../utils/testUtils'

describe('Backlog - sprint creation', () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it('creates a sprint when user fills the form and clicks create', async () => {
    const mockLoad = vi.fn()

    const existingSprints = []

    const created = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Objectif test'
    }

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve(existingSprints)
      return Promise.resolve([])
    })

    const mockPost = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve(created)
      return Promise.resolve({})
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, post: mockPost })

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView)

    // wait for onMounted loadBacklog
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // fill inputs: name, startDate, endDate, objective
    const inputs = wrapper.findAll('.backlog-controls input')
    expect(inputs.length).toBeGreaterThanOrEqual(3)
    await inputs[0].setValue('Sprint 1')
    await inputs[1].setValue('2025-11-20')
    await inputs[2].setValue('2025-11-27')

    const textarea = wrapper.find('.backlog-controls textarea')
    await textarea.setValue('Objectif test')

    // click create
    const createBtn = wrapper.find('.backlog-controls button')
    await createBtn.trigger('click')

    // allow async createSprint to resolve
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    expect(mockPost).toHaveBeenCalledWith('/api/sprints', expect.objectContaining({ name: 'Sprint 1', startDate: '2025-11-20', endDate: '2025-11-27', objective: 'Objectif test' }))

    // new sprint should appear in the DOM
    expect(wrapper.text()).toContain('Sprint 1')
  })

  it('edits a sprint using prompts and updates the DOM', async () => {
    const mockLoad = vi.fn()

  // no cards needed for sprint tests
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Old objective'
    }

    const updated = { ...sprint, name: 'Sprint 1 - Updated', startDate: '2025-11-21', endDate: '2025-11-28', objective: 'Updated objective' }

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([sprint])
      return Promise.resolve([])
    })

    const mockPatch = vi.fn((url) => {
      if (url === `/api/sprints/${sprint._id}`) return Promise.resolve(updated)
      return Promise.resolve({})
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, patch: mockPatch })

    // provide prompt values in order: name, start, end, objective
    const prompts = ['Sprint 1 - Updated', '2025-11-21', '2025-11-28', 'Updated objective']
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => prompts.shift())

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView)

    // wait for load
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // click Modifier on the sprint (first button)
    const actionBtns = wrapper.findAll('.sprint .sprint-actions button')
    expect(actionBtns.length).toBeGreaterThanOrEqual(1)
    await actionBtns[0].trigger('click')

    // allow async patch
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    expect(mockPatch).toHaveBeenCalledWith(`/api/sprints/${sprint._id}`, expect.objectContaining({ name: 'Sprint 1 - Updated', startDate: '2025-11-21', endDate: '2025-11-28', objective: 'Updated objective' }))

    // DOM updated
    expect(wrapper.text()).toContain('Sprint 1 - Updated')
    expect(wrapper.text()).toContain('Updated objective')

    promptSpy.mockRestore()
  })

  it('does not call patch when prompts return invalid values (empty name)', async () => {
    const mockLoad = vi.fn()

    const sprint = {
      _id: 'sprint3',
      name: 'Sprint Keep',
      startDate: '2025-10-10',
      endDate: '2025-10-17',
      objective: 'Keep objective'
    }

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([sprint])
      return Promise.resolve([])
    })

    const mockPatch = vi.fn(() => Promise.resolve({}))

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, patch: mockPatch })

    // first prompt returns empty name -> should abort without calling patch
    const prompts = ['', '2025-10-11', '2025-10-18', 'New objective']
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => prompts.shift())

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView)

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    const actionBtns = wrapper.findAll('.sprint .sprint-actions button')
    expect(actionBtns.length).toBeGreaterThanOrEqual(1)
    await actionBtns[0].trigger('click') // Modifier

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // patch should not have been called and DOM unchanged
    expect(mockPatch).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Sprint Keep')

    promptSpy.mockRestore()
  })

  it('deletes a sprint when confirmation accepted', async () => {
    const mockLoad = vi.fn()

    const sprint = {
      _id: 'sprint2',
      name: 'Sprint To Delete',
      startDate: '2025-11-01',
      endDate: '2025-11-07',
      objective: 'To be removed'
    }

    const mockGet = vi.fn((url) => {
      if (url === '/api/sprints') return Promise.resolve([sprint])
      return Promise.resolve([])
    })

    const mockDel = vi.fn(() => Promise.resolve())

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, del: mockDel })

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const { default: BacklogView } = await import('../../views/BacklogView.vue')
    const wrapper = mount(BacklogView)

    // wait for load
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // click Supprimer (second button)
    const actionBtns = wrapper.findAll('.sprint .sprint-actions button')
    expect(actionBtns.length).toBeGreaterThanOrEqual(2)
    await actionBtns[1].trigger('click')

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    expect(mockDel).toHaveBeenCalledWith(`/api/sprints/${sprint._id}`)
    expect(wrapper.text()).not.toContain('Sprint To Delete')

    confirmSpy.mockRestore()
  })
})
