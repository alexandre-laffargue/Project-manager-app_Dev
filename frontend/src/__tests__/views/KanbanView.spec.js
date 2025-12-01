import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuthStore, mockApi, resetTestMocks } from '../utils/testUtils'

// We'll dynamically mock modules per-test and import the component after mocking.
const mockLoad = vi.fn()
const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPatch = vi.fn()
const mockDel = vi.fn()

describe('KanbanView', () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it('shows login required message when not authenticated', async () => {
    // mock auth store (no token)
    mockAuthStore({ loadFromStorage: mockLoad, token: null })
    // mock api (no calls expected but safe)
    mockApi({ get: mockGet, post: mockPost, patch: mockPatch, del: mockDel })

    const { default: KanbanView } = await import('../../views/KanbanView.vue')
    const wrapper = mount(KanbanView)

    expect(wrapper.text()).toContain('Vous devez être connecté(e) pour accéder au tableau Kanban.')
  })

  it('loads board when authenticated and renders columns and tasks', async () => {
    // mock modules to simulate authenticated user and API responses
    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    // sample data returned by API
    const board = { _id: 'board1', name: 'My board' }
    const cols = [
      { _id: 'col1', title: 'To Do' },
      { _id: 'col2', title: 'Done' },
    ]
    const cards = [
      {
        _id: 'card1',
        title: 'Task A',
        description: 'Desc',
        priority: 'Medium',
        type: 'Task',
        columnId: 'col1',
      },
    ]

    mockGet.mockImplementation((url) => {
      if (url === '/api/boards/me') return Promise.resolve([board])
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve(cols)
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve(cards)
      return Promise.resolve([])
    })

    // mock api module after setting mockGet
    mockApi({ get: mockGet, post: mockPost, patch: mockPatch, del: mockDel })

    // import component after mocks
    const { default: KanbanView } = await import('../../views/KanbanView.vue')
    const wrapper = mount(KanbanView)

    // wait for async onMounted flow (allow promise microtasks and timers to flush)
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))
    await new Promise((r) => setTimeout(r, 0))

    // assert columns and task appear
    expect(wrapper.text()).toContain('To Do')
    expect(wrapper.text()).toContain('Task A')
  })
})
