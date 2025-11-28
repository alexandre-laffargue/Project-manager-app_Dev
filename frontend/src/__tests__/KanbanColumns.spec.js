import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuthStore, mockApi, resetTestMocks } from './utils/testUtils'

describe('Kanban - Columns', () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it('adds a column when user inputs a name and clicks add', async () => {
    const mockLoad = vi.fn()
    const board = { _id: 'board1', name: 'My board' }
    const cols = []
    const createdCol = { _id: 'col-new', title: 'New Col' }

    const mockGet = vi.fn((url) => {
      if (url === '/api/boards/me') return Promise.resolve([board])
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve(cols)
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve([])
      return Promise.resolve([])
    })
    const mockPost = vi.fn((url) => {
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve(createdCol)
      return Promise.resolve({})
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, post: mockPost })

    const { default: KanbanView } = await import('../views/KanbanView.vue')
    const wrapper = mount(KanbanView)

    // wait for initial load
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // set input and click add
    const input = wrapper.find('.kanban-controls input')
    await input.setValue('New Col')
    const addBtn = wrapper.find('.kanban-controls button')
    await addBtn.trigger('click')

    // allow async updates
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // post should have been called with expected url and payload
    expect(mockPost).toHaveBeenCalledWith(`/api/boards/${board._id}/columns`, expect.objectContaining({ title: 'New Col' }))

    // new column title should appear and input cleared
    expect(wrapper.text()).toContain('New Col')
    expect((wrapper.find('.kanban-controls input').element.value)).toBe('')
  })

  it('deletes a column when confirmed', async () => {
    const mockLoad = vi.fn()
    const board = { _id: 'board1', name: 'My board' }
    const cols = [{ _id: 'col1', title: 'To Delete' }]
    const cards = []

    const mockGet = vi.fn((url) => {
      if (url === '/api/boards/me') return Promise.resolve([board])
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve(cols)
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve(cards)
      return Promise.resolve([])
    })
    const mockDel = vi.fn(() => Promise.resolve())

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, del: mockDel })

    // stub confirm to accept deletion
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const { default: KanbanView } = await import('../views/KanbanView.vue')
    const wrapper = mount(KanbanView)

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // find delete button for the column (second button in header)
    const headerBtns = wrapper.findAll('.column .column-header button')
    expect(headerBtns.length).toBeGreaterThan(0)
    // trigger delete (button index 1 is 'Supprimer')
    await headerBtns[1].trigger('click')

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    expect(mockDel).toHaveBeenCalledWith(`/api/columns/${cols[0]._id}`)
    expect(wrapper.text()).not.toContain('To Delete')

    confirmSpy.mockRestore()
  })
})
