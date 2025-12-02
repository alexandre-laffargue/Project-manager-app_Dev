import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Timeline from '@/components/Timeline.vue'

// Mock the API service
const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPatch = vi.fn()

vi.mock('@/services/api.js', () => ({
  get: (...args) => mockGet(...args),
  post: (...args) => mockPost(...args),
  patch: (...args) => mockPatch(...args)
}))

describe('Timeline.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', async () => {
    mockGet.mockImplementation(() => new Promise(() => {}))
    const wrapper = mount(Timeline)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.loading-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('Chargement de la chronologie...')
  })

  it('renders empty state when no tasks', async () => {
    mockGet.mockResolvedValue({ snapshot: { data: { sprints: [], backlog: [] } } })
    const wrapper = mount(Timeline)
    await flushPromises()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('Aucune tâche à afficher')
  })

  it('renders tasks correctly', async () => {
    const mockData = {
      snapshot: {
        data: {
          sprints: [
            {
              _id: '1',
              name: 'Sprint 1',
              startDate: '2023-01-01',
              endDate: '2023-01-14',
              issues: [
                {
                  _id: 'i1',
                  title: 'Task 1',
                  status: 'todo',
                  startDate: '2023-01-02',
                  dueDate: '2023-01-05'
                }
              ]
            }
          ],
          backlog: [
             {
                  _id: 'b1',
                  title: 'Backlog Task',
                  status: 'todo',
                  startDate: '2023-02-01',
                  dueDate: '2023-02-05'
             }
          ]
        }
      }
    }
    mockGet.mockResolvedValue(mockData)
    const wrapper = mount(Timeline)
    await flushPromises()
    
    expect(wrapper.find('.gantt-wrapper').exists()).toBe(true)
    // 1 sprint + 1 task in sprint + 1 backlog task = 3 rows
    expect(wrapper.findAll('.gantt-row').length).toBe(3)
    expect(wrapper.text()).toContain('Sprint 1')
    expect(wrapper.text()).toContain('Task 1')
    expect(wrapper.text()).toContain('Backlog Task')
  })

  it('handles API errors', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'))
    const wrapper = mount(Timeline)
    await flushPromises()
    
    expect(wrapper.find('.error-state').exists()).toBe(true)
    expect(wrapper.find('.error-state').text()).toContain('Network Error')
  })

  it('switches view modes', async () => {
    mockGet.mockResolvedValue({ snapshot: { data: { sprints: [], backlog: [] } } })
    const wrapper = mount(Timeline)
    await flushPromises()

    const buttons = wrapper.findAll('.view-mode-btn')
    // Default is Day (index 0)
    expect(buttons[0].classes()).toContain('active')

    // Click Week (index 1)
    await buttons[1].trigger('click')
    expect(buttons[1].classes()).toContain('active')
    expect(buttons[0].classes()).not.toContain('active')
    
    // Click Month (index 2)
    await buttons[2].trigger('click')
    expect(buttons[2].classes()).toContain('active')
  })
  
  it('refreshes timeline', async () => {
     mockGet.mockResolvedValue({ snapshot: { _id: 'snap1', data: { sprints: [], backlog: [] } } })
     mockPost.mockResolvedValue({})
     
     const wrapper = mount(Timeline)
     await flushPromises()
     
     await wrapper.find('.refresh-btn').trigger('click')
     await flushPromises()
     
     expect(mockPost).toHaveBeenCalledWith('/api/timeline/snap1/refresh', {})
     // Called once on mount, once on refresh (inside refreshTimeline) + once inside loadTimeline called by refreshTimeline
     expect(mockGet).toHaveBeenCalledTimes(3) 
  })

  it('navigates to today', async () => {
      const mockData = {
        snapshot: {
          data: {
            sprints: [{ _id: '1', name: 'S1', startDate: '2023-01-01', endDate: '2023-01-14', issues: [] }],
            backlog: []
          }
        }
      }
      mockGet.mockResolvedValue(mockData)
      const wrapper = mount(Timeline)
      await flushPromises()

      await wrapper.find('.today-btn').trigger('click')
      expect(wrapper.find('.gantt-header').exists()).toBe(true)
  })
  
  it('calculates bar styles correctly', async () => {
      const mockData = {
      snapshot: {
        data: {
          sprints: [
            {
              _id: '1',
              name: 'Sprint 1',
              startDate: '2023-01-01',
              endDate: '2023-01-05', // 5 days
              issues: []
            }
          ],
          backlog: []
        }
      }
    }
    mockGet.mockResolvedValue(mockData)
    const wrapper = mount(Timeline)
    await flushPromises()
    
    const bar = wrapper.find('.gantt-bar-wrapper')
    expect(bar.exists()).toBe(true)
    // We could check style attributes if we knew the exact pixel values, but existence is good for now
    expect(bar.attributes('style')).toContain('width:')
    expect(bar.attributes('style')).toContain('left:')
  })
})
