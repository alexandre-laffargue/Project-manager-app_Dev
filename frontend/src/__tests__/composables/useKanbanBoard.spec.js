import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuthStore, mockApi, resetTestMocks } from '../utils/testUtils'

describe('useKanbanBoard composable', () => {
  beforeEach(() => {
    resetTestMocks()
  })

  it('initializes with empty state and calls loadBoardData', async () => {
    const mockLoad = vi.fn()
    const mockGet = vi.fn().mockResolvedValue([])

    mockAuthStore({ loadFromStorage: mockLoad, token: 'fake-token' })
    mockApi({ get: mockGet })

    const { default: useKanbanBoardModule } = await import('@/composables/kanban/useKanbanBoard')
    const { columns } = useKanbanBoardModule()

    await new Promise((r) => setTimeout(r, 100))

    expect(Array.isArray(columns)).toBe(true)
    expect(mockGet).toHaveBeenCalledWith('/api/boards/me')
  })

  it('creates a board when none exists', async () => {
    const board = { _id: 'board1', name: 'Mon tableau' }
    const mockGet = vi.fn()
      .mockResolvedValueOnce([]) // no boards
      .mockResolvedValueOnce([]) // columns
      .mockResolvedValueOnce([]) // cards
    const mockPost = vi.fn().mockResolvedValue(board)

    mockAuthStore({ loadFromStorage: vi.fn(), token: 'fake-token' })
    mockApi({ get: mockGet, post: mockPost })

    const { default: useKanbanBoardModule } = await import('@/composables/kanban/useKanbanBoard')
    useKanbanBoardModule()

    await new Promise((r) => setTimeout(r, 100))

    expect(mockPost).toHaveBeenCalledWith('/api/boards', { name: 'Mon tableau' })
  })

  it('loads columns and cards into reactive state', async () => {
    const board = { _id: 'board1', name: 'My Board' }
    const cols = [{ _id: 'col1', title: 'To Do' }]
    const cards = [{ _id: 'card1', title: 'Task A', columnId: 'col1' }]

    const mockGet = vi.fn((url) => {
      if (url === '/api/boards/me') return Promise.resolve([board])
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve(cols)
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve(cards)
      return Promise.resolve([])
    })

    mockAuthStore({ loadFromStorage: vi.fn(), token: 'fake-token' })
    mockApi({ get: mockGet })

    const { default: useKanbanBoardModule } = await import('@/composables/kanban/useKanbanBoard')
    const { columns } = useKanbanBoardModule()

    await new Promise((r) => setTimeout(r, 100))

    expect(columns.length).toBe(1)
    expect(columns[0].title).toBe('To Do')
    expect(columns[0].tasks.length).toBe(1)
    expect(columns[0].tasks[0].title).toBe('Task A')
  })

  it('addColumn creates a column and adds to state', async () => {
    const board = { _id: 'board1', name: 'My Board' }
    const createdCol = { _id: 'col-new', key: 'new-col', title: 'New Col', order: 0 }

    const mockGet = vi.fn((url) => {
      if (url === '/api/boards/me') return Promise.resolve([board])
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve([])
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve([])
      return Promise.resolve([])
    })
    const mockPost = vi.fn().mockResolvedValue(createdCol)

    mockAuthStore({ loadFromStorage: vi.fn(), token: 'fake-token' })
    mockApi({ get: mockGet, post: mockPost })

    const { default: useKanbanBoardModule } = await import('@/composables/kanban/useKanbanBoard')
    const { columns, newColumnName, addColumn } = useKanbanBoardModule()

    await new Promise((r) => setTimeout(r, 100))

    newColumnName.value = 'New Col'
    await addColumn()

    expect(mockPost).toHaveBeenCalledWith('/api/boards/board1/columns', {
      key: 'new-col',
      title: 'New Col',
      order: 0
    })
    expect(columns.length).toBe(1)
    expect(columns[0].title).toBe('New Col')
    expect(newColumnName.value).toBe('')
  })

  it('handleCreateCard adds a card to the correct column', async () => {
    const board = { _id: 'board1', name: 'My Board' }
    const cols = [{ _id: 'col1', title: 'To Do' }]
    const createdCard = { _id: 'card-new', title: 'New Task', columnId: 'col1' }

    const mockGet = vi.fn((url) => {
      if (url === '/api/boards/me') return Promise.resolve([board])
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve(cols)
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve([])
      return Promise.resolve([])
    })
    const mockPost = vi.fn().mockResolvedValue(createdCard)

    mockAuthStore({ loadFromStorage: vi.fn(), token: 'fake-token' })
    mockApi({ get: mockGet, post: mockPost })

    const { default: useKanbanBoardModule } = await import('@/composables/kanban/useKanbanBoard')
    const { columns, handleCreateCard } = useKanbanBoardModule()

    await new Promise((r) => setTimeout(r, 100))

    const column = columns[0]
    await handleCreateCard(column, { title: 'New Task', columnId: 'col1' })

    expect(mockPost).toHaveBeenCalledWith('/api/boards/board1/cards', { title: 'New Task', columnId: 'col1' })
    expect(column.tasks.length).toBe(1)
    expect(column.tasks[0].title).toBe('New Task')
  })

  it('handleUpdateCard updates a card in state', async () => {
    const board = { _id: 'board1', name: 'My Board' }
    const cols = [{ _id: 'col1', title: 'To Do' }]
    const cards = [{ _id: 'card1', title: 'Old Title', columnId: 'col1', priority: 'Medium', type: 'Task' }]
    const updatedCard = { _id: 'card1', title: 'New Title', columnId: 'col1', priority: 'High', type: 'Bug', description: 'Updated' }

    const mockGet = vi.fn((url) => {
      if (url === '/api/boards/me') return Promise.resolve([board])
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve(cols)
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve(cards)
      return Promise.resolve([])
    })
    const mockPatch = vi.fn().mockResolvedValue(updatedCard)

    mockAuthStore({ loadFromStorage: vi.fn(), token: 'fake-token' })
    mockApi({ get: mockGet, patch: mockPatch })

    const { default: useKanbanBoardModule } = await import('@/composables/kanban/useKanbanBoard')
    const { columns, handleUpdateCard } = useKanbanBoardModule()

    await new Promise((r) => setTimeout(r, 100))

    const column = columns[0]
    const card = column.tasks[0]
    await handleUpdateCard(column, card, { title: 'New Title', priority: 'High', type: 'Bug', description: 'Updated' })

    expect(mockPatch).toHaveBeenCalledWith('/api/cards/card1', { title: 'New Title', priority: 'High', type: 'Bug', description: 'Updated' })
    expect(card.title).toBe('New Title')
    expect(card.priority).toBe('High')
    expect(card.type).toBe('Bug')
    expect(card.description).toBe('Updated')
  })

  it('dropTask moves a card between columns', async () => {
    const board = { _id: 'board1', name: 'My Board' }
    const cols = [{ _id: 'col1', title: 'To Do' }, { _id: 'col2', title: 'Done' }]
    const cards = [{ _id: 'card1', title: 'Task', columnId: 'col1' }]

    const mockGet = vi.fn((url) => {
      if (url === '/api/boards/me') return Promise.resolve([board])
      if (url === `/api/boards/${board._id}/columns`) return Promise.resolve(cols)
      if (url === `/api/boards/${board._id}/cards`) return Promise.resolve(cards)
      return Promise.resolve([])
    })
    const mockPatch = vi.fn().mockResolvedValue({})

    mockAuthStore({ loadFromStorage: vi.fn(), token: 'fake-token' })
    mockApi({ get: mockGet, patch: mockPatch })

    const { default: useKanbanBoardModule } = await import('@/composables/kanban/useKanbanBoard')
    const { columns, startDrag, dropTask } = useKanbanBoardModule()

    await new Promise((r) => setTimeout(r, 100))

    const task = columns[0].tasks[0]
    startDrag(task, 'col1')
    await dropTask('col2')

    expect(mockPatch).toHaveBeenCalledWith('/api/cards/card1', { toColumnId: 'col2' })
    expect(columns[0].tasks.length).toBe(0)
    expect(columns[1].tasks.length).toBe(1)
    expect(columns[1].tasks[0].title).toBe('Task')
  })
})
