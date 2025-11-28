import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import KanbanCard from '@/components/kanban/KanbanCard.vue'
import KanbanColumn from '@/components/kanban/KanbanColumn.vue'

describe('KanbanCard - Edge Cases', () => {
  const mockCard = {
    _id: 'card1',
    title: 'Test Card',
    description: 'Test Description',
    priority: 'Medium',
    type: 'Task'
  }

  it('handles empty description', () => {
    const card = { ...mockCard, description: '' }
    const wrapper = mount(KanbanCard, { props: { card } })
    
    expect(wrapper.find('.task-desc').text()).toBe('')
  })

  it('handles very long titles', () => {
    const longTitle = 'A'.repeat(200)
    const card = { ...mockCard, title: longTitle }
    const wrapper = mount(KanbanCard, { props: { card } })
    
    expect(wrapper.find('.task-title').text()).toBe(longTitle)
  })

  it('handles missing optional fields', () => {
    const minimalCard = {
      _id: 'card1',
      title: 'Minimal',
      columnId: 'col1'
    }
    const wrapper = mount(KanbanCard, { props: { card: minimalCard } })
    
    expect(wrapper.exists()).toBe(true)
  })

  it('emits delete event when delete button clicked', async () => {
    const wrapper = mount(KanbanCard, { props: { card: mockCard } })
    
    await wrapper.find('.task-actions button:last-child').trigger('click')
    
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0]).toEqual([mockCard])
  })

  it('cancels edit mode and restores original values', async () => {
    const wrapper = mount(KanbanCard, { props: { card: mockCard } })
    
    // Enter edit mode
    await wrapper.find('.task-actions button:first-child').trigger('click')
    expect(wrapper.find('.edit-title').exists()).toBe(true)
    
    // Change values
    await wrapper.find('.edit-title').setValue('Changed Title')
    
    // Cancel
    const cancelBtn = wrapper.findAll('.edit-controls button').find(b => b.text().includes('Annuler'))
    await cancelBtn.trigger('click')
    
    // Should show original title
    expect(wrapper.find('.task-title').text()).toBe('Test Card')
  })

  it('validates required fields before save', async () => {
    const wrapper = mount(KanbanCard, { props: { card: mockCard } })
    
    await wrapper.find('.task-actions button:first-child').trigger('click')
    await wrapper.find('.edit-title').setValue('')
    
    const saveBtn = wrapper.findAll('.edit-controls button').find(b => b.text().includes('Sauvegarder'))
    await saveBtn.trigger('click')
    
    // Empty title should not emit update
    expect(wrapper.emitted('update')).toBeFalsy()
  })

  it('handles all priority levels correctly', async () => {
    const priorities = ['Low', 'Medium', 'High']
    
    for (const priority of priorities) {
      const card = { ...mockCard, priority }
      const wrapper = mount(KanbanCard, { props: { card } })
      
      const badge = wrapper.find('.badge.priority')
      expect(badge.text()).toBe(priority)
      expect(badge.classes()).toContain(priority.toLowerCase())
    }
  })

  it('handles all task types correctly', () => {
    const types = ['Bug', 'Feature', 'Task']
    
    for (const type of types) {
      const card = { ...mockCard, type }
      const wrapper = mount(KanbanCard, { props: { card } })
      
      expect(wrapper.find('.badge.type').text()).toBe(type)
    }
  })

  it('emits start-drag event with card data', async () => {
    const wrapper = mount(KanbanCard, { props: { card: mockCard } })
    
    await wrapper.find('.task').trigger('dragstart')
    
    expect(wrapper.emitted('start-drag')).toBeTruthy()
  })
})

describe('KanbanColumn - Edge Cases', () => {
  const mockColumn = {
    _id: 'col1',
    title: 'To Do',
    tasks: [
      { _id: 'task1', title: 'Task 1', priority: 'High', type: 'Bug' },
      { _id: 'task2', title: 'Task 2', priority: 'Low', type: 'Feature' }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty column correctly', () => {
    const emptyColumn = { ...mockColumn, tasks: [] }
    const wrapper = mount(KanbanColumn, {
      props: { column: emptyColumn },
      global: {
        stubs: { KanbanCard: true }
      }
    })
    
    expect(wrapper.find('.tasks-list').exists()).toBe(true)
    expect(wrapper.findAll('.task').length).toBe(0)
  })

  it('handles column with many tasks', () => {
    const manyTasks = Array.from({ length: 50 }, (_, i) => ({
      _id: `task${i}`,
      title: `Task ${i}`,
      priority: 'Medium',
      type: 'Task'
    }))
    const column = { ...mockColumn, tasks: manyTasks }
    
    const wrapper = mount(KanbanColumn, {
      props: { column },
      global: {
        stubs: { KanbanCard: true }
      }
    })
    
    expect(wrapper.findAll('kanban-card-stub').length).toBe(50)
  })

  it('prevents creating card with empty title', async () => {
    const wrapper = mount(KanbanColumn, {
      props: { column: mockColumn },
      global: {
        stubs: { KanbanCard: true }
      }
    })
    
    const addBtn = wrapper.find('.add-card button')
    await addBtn.trigger('click')
    
    expect(wrapper.emitted('create-card')).toBeFalsy()
  })

  it('resets form after creating card', async () => {
    const wrapper = mount(KanbanColumn, {
      props: { column: mockColumn },
      global: {
        stubs: { KanbanCard: true }
      }
    })
    
    const inputs = wrapper.findAll('.add-card input')
    await inputs[0].setValue('New Task')
    await inputs[1].setValue('Description')
    
    const addBtn = wrapper.find('.add-card button')
    await addBtn.trigger('click')
    
    // Form should be reset
    expect(inputs[0].element.value).toBe('')
    expect(inputs[1].element.value).toBe('')
  })

  it('emits drop-task event on drop', async () => {
    const wrapper = mount(KanbanColumn, {
      props: { column: mockColumn },
      global: {
        stubs: { KanbanCard: true }
      }
    })
    
    await wrapper.find('.column').trigger('drop')
    
    expect(wrapper.emitted('drop-task')).toBeTruthy()
    expect(wrapper.emitted('drop-task')[0]).toEqual([mockColumn._id])
  })
})
