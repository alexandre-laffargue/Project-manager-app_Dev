import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuthStore, mockApi, resetTestMocks } from './utils/testUtils'

describe('Kanban actions (columns & cards)', () => {
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

    const { default: KanbanView } = await import('../views/KanbanView.vue')
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

    const { default: KanbanView } = await import('../views/KanbanView.vue')
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

  it('edits a card and updates its fields', async () => {
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

    // provide invalid priority/type values first to test normalization, then valid ones
    const promptValues = ['New Title', 'New desc', 'INVALID_PRIORITY', 'INVALID_TYPE']
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => promptValues.shift())

    const { default: KanbanView } = await import('../views/KanbanView.vue')
    const wrapper = mount(KanbanView)

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // click edit on the task
    const editBtns = wrapper.findAll('.task .task-actions button')
    // first button is Modifier
    await editBtns[0].trigger('click')

    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))

    // the component should sanitize invalid priority/type to defaults
    expect(mockPatch).toHaveBeenCalledWith(`/api/cards/${cards[0]._id}`, expect.objectContaining({ title: 'New Title', priority: 'Medium', type: 'Task' }))

    // verify DOM updated
    expect(wrapper.text()).toContain('New Title')
    expect(wrapper.text()).toContain('New desc')
    expect(wrapper.find('.badge.priority').text()).toBe('High')
    expect(wrapper.find('.badge.type').text()).toBe('Feature')

    promptSpy.mockRestore()
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

    const { default: KanbanView } = await import('../views/KanbanView.vue')
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
