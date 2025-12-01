import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TaskModal from '../../../components/kanban/TaskModal.vue'

describe('TaskModal', () => {
  it('renders correctly when open with create mode', async () => {
    const wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 0,
      },
    })

    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nouvelle carte')
    expect(wrapper.find('#task-title').exists()).toBe(true)
    expect(wrapper.find('#task-description').exists()).toBe(true)
    expect(wrapper.find('#task-priority').exists()).toBe(true)
    expect(wrapper.find('#task-type').exists()).toBe(true)
  })

  it('does not render when closed', () => {
    const wrapper = mount(TaskModal, {
      props: {
        isOpen: false,
        columnId: 'col1',
        position: 0,
      },
    })

    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('renders in edit mode when task prop is provided', async () => {
    const task = {
      title: 'Existing Task',
      description: 'Task description',
      priority: 'High',
      type: 'Bug',
    }

    const wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        task,
        columnId: 'col1',
        position: 0,
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Modifier la carte')
    expect(wrapper.find('#task-title').element.value).toBe('Existing Task')
    expect(wrapper.find('#task-description').element.value).toBe('Task description')
    expect(wrapper.find('#task-priority').element.value).toBe('High')
    expect(wrapper.find('#task-type').element.value).toBe('Bug')
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 0,
      },
    })

    await wrapper.find('.close-btn').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close event when Annuler button is clicked', async () => {
    const wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 0,
      },
    })

    const buttons = wrapper.findAll('.modal-actions button')
    // Annuler is the second button (index 1)
    await buttons[1].trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits submit event with correct payload when form is submitted in create mode', async () => {
    const wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 3,
      },
    })

    await wrapper.find('#task-title').setValue('New Card')
    await wrapper.find('#task-description').setValue('Card description')
    await wrapper.find('#task-priority').setValue('High')
    await wrapper.find('#task-type').setValue('Feature')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeTruthy()
    const submitPayload = wrapper.emitted('submit')[0][0]
    expect(submitPayload).toEqual({
      title: 'New Card',
      description: 'Card description',
      priority: 'High',
      type: 'Feature',
      columnId: 'col1',
      position: 3,
    })
  })

  it('emits submit event without columnId/position in edit mode', async () => {
    const task = {
      title: 'Old Title',
      description: 'Old desc',
      priority: 'Low',
      type: 'Task',
    }

    const wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        task,
        columnId: 'col1',
        position: 0,
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.find('#task-title').setValue('Updated Title')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeTruthy()
    const submitPayload = wrapper.emitted('submit')[0][0]
    expect(submitPayload).toEqual({
      title: 'Updated Title',
      description: 'Old desc',
      priority: 'Low',
      type: 'Task',
    })
    expect(submitPayload.columnId).toBeUndefined()
    expect(submitPayload.position).toBeUndefined()
  })

  it('does not submit when title is empty', async () => {
    const wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 0,
      },
    })

    await wrapper.find('#task-title').setValue('')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('button order is correct: Créer first, Annuler second', async () => {
    const wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 0,
      },
    })

    const buttons = wrapper.findAll('.modal-actions button')
    expect(buttons.length).toBe(2)
    // First button should be primary (Créer)
    expect(buttons[0].classes()).toContain('btn-primary')
    expect(buttons[0].text()).toBe('Créer')
    // Second button should be secondary (Annuler)
    expect(buttons[1].classes()).toContain('btn-secondary')
    expect(buttons[1].text()).toBe('Annuler')
  })
})
