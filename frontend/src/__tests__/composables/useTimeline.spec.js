import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTimeline } from '@/composables/timeline/useTimeline'
import * as api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

// Mock API
vi.mock('@/services/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn()
}))

describe('useTimeline composable', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    store.token = 'fake-token'
    store.user = { id: 'user-1', name: 'Test User' }
    
    // Reset mocks
    vi.clearAllMocks()
  })

  it('initializes with default values', () => {
    const { timelines, currentTimeline, tasks, loading, error } = useTimeline()
    expect(timelines.value).toEqual([])
    expect(currentTimeline.value).toBeNull()
    expect(tasks.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('loadTimelines loads board and timelines successfully', async () => {
    const { loadTimelines, timelines, currentTimeline } = useTimeline()

    // Mock API responses
    api.get.mockImplementation((url) => {
      if (url === '/api/boards/me') return Promise.resolve([{ _id: 'board-1', name: 'My Board' }])
      if (url.includes('/api/timeline')) return Promise.resolve([{ _id: 'timeline-1', name: 'Timeline 1', data: {} }])
      if (url === '/api/sprints') return Promise.resolve([])
      if (url === '/api/issues') return Promise.resolve([])
      return Promise.resolve([])
    })
    
    // Mock refreshTimeline implicitly called if data is empty
    api.post.mockResolvedValue({ snapshot: { _id: 'timeline-1', name: 'Timeline 1', data: { sprints: [] } } })

    await loadTimelines()

    expect(api.get).toHaveBeenCalledWith('/api/boards/me')
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/api/timeline'))
    expect(timelines.value.length).toBe(1)
    expect(currentTimeline.value).toBeTruthy()
    expect(currentTimeline.value._id).toBe('timeline-1')
  })

  it('createTimeline creates a new timeline and selects it', async () => {
    const { createTimeline, timelines, currentTimeline } = useTimeline()

    // Mock board existence
    api.get.mockResolvedValueOnce([{ _id: 'board-1' }])
    
    // Mock creation response
    const newTimeline = { _id: 'timeline-2', name: 'New Timeline', data: {} }
    api.post.mockResolvedValueOnce({ snapshot: newTimeline })
    
    // Mock refresh called inside createTimeline
    api.post.mockResolvedValueOnce({ snapshot: { ...newTimeline, data: { sprints: [] } } })

    await createTimeline({ name: 'New Timeline' })

    expect(api.post).toHaveBeenCalledWith('/api/timeline', expect.objectContaining({
      boardId: 'board-1',
      name: 'New Timeline'
    }))
    expect(timelines.value).toContainEqual(expect.objectContaining({ _id: 'timeline-2' }))
    expect(currentTimeline.value._id).toBe('timeline-2')
  })

  it('updateTimeline updates existing timeline', async () => {
    const { updateTimeline, timelines, currentTimeline, selectTimeline } = useTimeline()
    
    // Setup initial state
    const initialTimeline = { _id: 'timeline-1', name: 'Old Name' }
    timelines.value = [initialTimeline]
    selectTimeline(initialTimeline)

    // Mock update response
    const updatedSnapshot = { _id: 'timeline-1', name: 'New Name' }
    api.patch.mockResolvedValueOnce({ snapshot: updatedSnapshot })

    await updateTimeline('timeline-1', { name: 'New Name' })

    expect(api.patch).toHaveBeenCalledWith('/api/timeline/timeline-1', { name: 'New Name' })
    expect(timelines.value[0].name).toBe('New Name')
    expect(currentTimeline.value.name).toBe('New Name')
  })

  it('deleteTimeline removes timeline from list', async () => {
    const { deleteTimeline, timelines, currentTimeline, selectTimeline } = useTimeline()

    // Setup initial state
    const t1 = { _id: 't1', name: 'T1' }
    const t2 = { _id: 't2', name: 'T2' }
    timelines.value = [t1, t2]
    selectTimeline(t1)

    api.del.mockResolvedValueOnce({})

    await deleteTimeline(t1)

    expect(api.del).toHaveBeenCalledWith('/api/timeline/t1')
    expect(timelines.value.length).toBe(1)
    expect(timelines.value[0]._id).toBe('t2')
    expect(currentTimeline.value._id).toBe('t2')
  })

  it('refreshTimeline calls refresh endpoint and updates current timeline', async () => {
    const { refreshTimeline, timelines, currentTimeline, selectTimeline } = useTimeline()

    const t1 = { _id: 't1', name: 'T1', data: {} }
    timelines.value = [t1]
    selectTimeline(t1)

    const refreshedSnapshot = { 
      _id: 't1', 
      name: 'T1', 
      data: { 
        sprints: [{ _id: 's1', name: 'Sprint 1', startDate: '2023-01-01', endDate: '2023-01-14', issues: [] }] 
      } 
    }
    api.post.mockResolvedValueOnce({ snapshot: refreshedSnapshot })

    await refreshTimeline()

    expect(api.post).toHaveBeenCalledWith('/api/timeline/t1/refresh', {})
    expect(currentTimeline.value.data.sprints.length).toBe(1)
  })

  it('updateTaskDates calls correct endpoint for sprint', async () => {
    const { updateTaskDates } = useTimeline()

    const task = { id: 'sprint-123', type: 'sprint' }
    await updateTaskDates(task, '2023-02-01', '2023-02-14')

    expect(api.patch).toHaveBeenCalledWith('/api/sprints/123', {
      startDate: '2023-02-01',
      endDate: '2023-02-14'
    })
  })

  it('updateTaskDates calls correct endpoint for issue', async () => {
    const { updateTaskDates } = useTimeline()

    const task = { id: 'issue-456', type: 'issue' }
    await updateTaskDates(task, '2023-02-01', '2023-02-03')

    expect(api.patch).toHaveBeenCalledWith('/api/issues/456', {
      startDate: '2023-02-01',
      endDate: '2023-02-03'
    })
  })
  
  it('convertToGanttTasks correctly formats tasks', () => {
    const { selectTimeline, tasks } = useTimeline()
    
    const timelineData = {
      sprints: [
        { 
          _id: 's1', 
          name: 'Sprint 1', 
          startDate: '2023-01-01', 
          endDate: '2023-01-14',
          issues: [
            { _id: 'i1', title: 'Issue 1', status: 'done', startDate: '2023-01-02', endDate: '2023-01-05' }
          ]
        }
      ],
      backlog: [
        { _id: 'b1', title: 'Backlog Issue', status: 'todo' }
      ]
    }
    
    selectTimeline({ _id: 't1', data: timelineData })
    
    expect(tasks.value.length).toBe(3) // Sprint + Issue + Backlog Issue
    
    const sprintTask = tasks.value.find(t => t.type === 'sprint')
    expect(sprintTask).toBeDefined()
    expect(sprintTask.id).toBe('sprint-s1')
    expect(sprintTask.progress).toBe(100) // 1 issue, done => 100%
    
    const issueTask = tasks.value.find(t => t.type === 'issue')
    expect(issueTask).toBeDefined()
    expect(issueTask.id).toBe('issue-i1')
    expect(issueTask.progress).toBe(100)
    
    const backlogTask = tasks.value.find(t => t.type === 'backlog-issue')
    expect(backlogTask).toBeDefined()
    expect(backlogTask.id).toBe('backlog-issue-b1')
    expect(backlogTask.progress).toBe(0)
  })
})
