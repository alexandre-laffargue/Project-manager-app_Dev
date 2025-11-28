import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuthStore, mockApi, resetTestMocks } from '../../utils/testUtils'

describe('Kanban - Cards', () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it('adds and then deletes a card', async () => {
    const mockLoad = vi.fn()
    const board = { _id: 'board1', name: 'My board' }
    const cols = [{ _id: 'col1', title: 'Col A' }]
    const existingCards = []

    const createdCard = { _id: 'card-new', title: 'New Task', description: '', priority: 'Medium', type: 'Task', columnId: 'col1' }

    const mockGet = vi.fn((url) => {
      if (url === '/api/boards/me') return Promise.resolve([board])
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve(cols)
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve(existingCards)
      return Promise.resolve([])
    })
    const mockPost = vi.fn((url) => {
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve(createdCard)
      return Promise.resolve({})
    })
    const mockDel = vi.fn(() => Promise.resolve())

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, post: mockPost, del: mockDel })

    const { default: KanbanView } = await import('../../../views/KanbanView.vue')
    const wrapper = mount(KanbanView)

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // find the add-card area for the first column
    const addCardAreas = wrapper.findAll('.add-card')
    expect(addCardAreas.length).toBeGreaterThan(0)
    const area = addCardAreas[0]
    const titleInput = area.find('input')
    await titleInput.setValue('New Task')
    const addBtn = area.find('button')
    await addBtn.trigger('click')

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // verify post called
    expect(mockPost).toHaveBeenCalledWith(`/api/boards/${board._id}/cards`, expect.objectContaining({ title: 'New Task', columnId: 'col1' }))

    // card appears
    expect(wrapper.text()).toContain('New Task')

    // now delete the card: find delete button inside .task .task-actions (second button)
    const deleteBtns = wrapper.findAll('.task .task-actions button')
    // there may be multiple; find the one with text 'X' or second
    expect(deleteBtns.length).toBeGreaterThan(0)
    // stub confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    await deleteBtns[deleteBtns.length - 1].trigger('click')

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // deletion should call API and remove from DOM
    expect(mockDel).toHaveBeenCalledWith(`/api/cards/${createdCard._id}`)
    expect(wrapper.text()).not.toContain('New Task')

    confirmSpy.mockRestore()
  })

  it('adds a card with description, priority and type', async () => {
    const mockLoad = vi.fn()
    const board = { _id: 'board1', name: 'My board' }
    const cols = [{ _id: 'col1', title: 'Col A' }]
    const existingCards = []

    const createdCard = { _id: 'card-new', title: 'New Task', description: 'Details', priority: 'High', type: 'Bug', columnId: 'col1' }

    const mockGet = vi.fn((url) => {
      if (url === '/api/boards/me') return Promise.resolve([board])
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve(cols)
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve(existingCards)
      return Promise.resolve([])
    })
    const mockPost = vi.fn((url) => {
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve(createdCard)
      return Promise.resolve({})
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, post: mockPost })

    const { default: KanbanView } = await import('../../../views/KanbanView.vue')
    const wrapper = mount(KanbanView)

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    const area = wrapper.find('.add-card')
    const inputs = area.findAll('input')
    // title then description
    await inputs[0].setValue('New Task')
    await inputs[1].setValue('Details')

    const selects = area.findAll('select')
    await selects[0].setValue('High') // priority
    await selects[1].setValue('Bug') // type

    const addBtn = area.find('button')
    await addBtn.trigger('click')

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    expect(mockPost).toHaveBeenCalledWith(`/api/boards/${board._id}/cards`, expect.objectContaining({ title: 'New Task', description: 'Details', priority: 'High', type: 'Bug', columnId: 'col1' }))

    expect(wrapper.text()).toContain('New Task')
    expect(wrapper.text()).toContain('Details')
    expect(wrapper.find('.badge.priority').text()).toBe('High')
    expect(wrapper.find('.badge.type').text()).toBe('Bug')
  })

  it('edits a card and updates its fields (inline editor)', async () => {
    const mockLoad = vi.fn()
    const board = { _id: 'board1', name: 'My board' }
    const cols = [{ _id: 'col1', title: 'Col A' }]
    const cards = [ { _id: 'card1', title: 'Old Title', description: 'Old desc', priority: 'Medium', type: 'Task', columnId: 'col1' } ]

    const mockGet = vi.fn((url) => {
      if (url === '/api/boards/me') return Promise.resolve([board])
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve(cols)
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve(cards)
      return Promise.resolve([])
    })

    const updatedCard = { ...cards[0], title: 'New Title', description: 'New desc', priority: 'High', type: 'Feature' }
    const mockPatch = vi.fn((url) => {
      if (url === `/api/cards/${cards[0]._id}`) return Promise.resolve(updatedCard)
      return Promise.resolve({})
    })

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, patch: mockPatch })

    const { default: KanbanView } = await import('../../../views/KanbanView.vue')
    const wrapper = mount(KanbanView)

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // find the task wrapper by its initial title
    const tasks = wrapper.findAll('.task')
    const task = tasks.find((t) => t.text().includes('Old Title'))
    expect(task).toBeTruthy()

    // open inline editor by clicking the 'Modifier' button
    const editBtns = task.findAll('.task-actions button')
    const editBtn = editBtns.find((b) => b.text().includes('Modifier')) || editBtns[0]
    await editBtn.trigger('click')

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // re-query the task area (DOM changed after editing)
    const updatedTask = wrapper.findAll('.task').find((t) => t.text().includes('Old Title') || t.find('.edit-title').exists())
    expect(updatedTask).toBeTruthy()

    // fill inline editor fields
    const titleInput = updatedTask.find('.edit-title')
    const descInput = updatedTask.find('.edit-desc')
    const selects = updatedTask.findAll('select')
    await titleInput.setValue('New Title')
    await descInput.setValue('New desc')
    // set priority and type to valid values
    if (selects.length >= 2) {
      await selects[0].setValue('High')
      await selects[1].setValue('Feature')
    }

    // click save (find button labeled 'Sauvegarder') inside the updated task
    const saveBtn = updatedTask.findAll('button').find((b) => b.text().includes('Sauvegarder'))
    expect(saveBtn.exists()).toBe(true)
    await saveBtn.trigger('click')

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // patch should have been called with normalized payload
    expect(mockPatch).toHaveBeenCalledWith(`/api/cards/${cards[0]._id}`, expect.objectContaining({ title: 'New Title', description: 'New desc', priority: 'High', type: 'Feature' }))

    // verify DOM updated
    expect(wrapper.text()).toContain('New Title')
    expect(wrapper.text()).toContain('New desc')
    expect(wrapper.find('.badge.priority').text()).toBe('High')
    expect(wrapper.find('.badge.type').text()).toBe('Feature')
  })

  it('moves a card from one column to another', async () => {
    const mockLoad = vi.fn()
    const board = { _id: 'board1', name: 'My board' }
    const cols = [{ _id: 'col1', title: 'Col A' }, { _id: 'col2', title: 'Col B' }]
    const cards = [ { _id: 'card1', title: 'Move Me', description: '', priority: 'Medium', type: 'Task', columnId: 'col1' } ]

    const mockGet = vi.fn((url) => {
      if (url === '/api/boards/me') return Promise.resolve([board])
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve(cols)
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve(cards)
      return Promise.resolve([])
    })
    const mockPatch = vi.fn(() => Promise.resolve({}))

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet, patch: mockPatch })

    const { default: KanbanView } = await import('../../../views/KanbanView.vue')
    const wrapper = mount(KanbanView)

    // wait initial load
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // find the task and trigger dragstart
    const task = wrapper.find('.task')
    expect(task.text()).toContain('Move Me')
    await task.trigger('dragstart')

    // trigger drop on second column
    const columns = wrapper.findAll('.column')
    expect(columns.length).toBeGreaterThan(1)
    const target = columns[1]
    await target.trigger('drop')

    // allow async patch to resolve
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // patch should have been called to move the card
    expect(mockPatch).toHaveBeenCalledWith(`/api/cards/${cards[0]._id}`, expect.objectContaining({ toColumnId: 'col2' }))

    // card should now appear in target column
    const targetText = target.text()
    expect(targetText).toContain('Move Me')
  })
})
