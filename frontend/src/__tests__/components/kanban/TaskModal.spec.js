import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach } from 'vitest'
import TaskModal from '../../../components/kanban/TaskModal.vue'

describe('TaskModal', () => {
  let wrapper

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('renders correctly when open with create mode', async () => {
    wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 0,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('.modal-overlay')).toBeTruthy()
    expect(document.body.textContent).toContain('Nouvelle carte')
    expect(document.body.querySelector('#task-title')).toBeTruthy()
    expect(document.body.querySelector('#task-description')).toBeTruthy()
    expect(document.body.querySelector('#task-priority')).toBeTruthy()
    expect(document.body.querySelector('#task-type')).toBeTruthy()
  })

  it('does not render when closed', () => {
    wrapper = mount(TaskModal, {
      props: {
        isOpen: false,
        columnId: 'col1',
        position: 0,
      },
      attachTo: document.body,
    })

    expect(document.body.querySelector('.modal-overlay')).toBeFalsy()
  })

  it('renders in edit mode when task prop is provided', async () => {
    const task = {
      title: 'Existing Task',
      description: 'Task description',
      priority: 'High',
      type: 'Bug',
    }

    wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 0,
        task,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    expect(document.body.textContent).toContain('Modifier la carte')
    expect(document.body.querySelector('#task-title').value).toBe('Existing Task')
    expect(document.body.querySelector('#task-description').value).toBe('Task description')
    expect(document.body.querySelector('#task-priority').value).toBe('High')
    expect(document.body.querySelector('#task-type').value).toBe('Bug')
  })

  it('emits close event when close button is clicked', async () => {
    wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 0,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()
    const closeBtn = document.body.querySelector('.close-btn')
    closeBtn.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close event when Annuler button is clicked', async () => {
    wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 0,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()
    const buttons = document.body.querySelectorAll('.modal-actions button')
    // Annuler is the second button (index 1)
    buttons[1].click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits submit event with correct payload when form is submitted in create mode', async () => {
    wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 2,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    const titleInput = document.body.querySelector('#task-title')
    const descInput = document.body.querySelector('#task-description')
    const prioritySelect = document.body.querySelector('#task-priority')
    const typeSelect = document.body.querySelector('#task-type')

    titleInput.value = 'New Task'
    titleInput.dispatchEvent(new Event('input'))
    descInput.value = 'Description'
    descInput.dispatchEvent(new Event('input'))
    prioritySelect.value = 'High'
    prioritySelect.dispatchEvent(new Event('change'))
    typeSelect.value = 'Feature'
    typeSelect.dispatchEvent(new Event('change'))

    await wrapper.vm.$nextTick()

    const form = document.body.querySelector('form')
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toEqual({
      title: 'New Task',
      description: 'Description',
      priority: 'High',
      type: 'Feature',
      columnId: 'col1',
      position: 2,
    })
  })

  it('emits submit event without columnId/position in edit mode', async () => {
    const task = {
      title: 'Old Title',
      description: 'Old desc',
      priority: 'Low',
      type: 'Task',
    }

    wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        task,
        columnId: 'col1',
        position: 0,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    const titleInput = document.body.querySelector('#task-title')
    titleInput.value = 'Updated Title'
    titleInput.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()

    const form = document.body.querySelector('form')
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    const submitPayload = emitted[0][0]
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
    wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 0,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    const titleInput = document.body.querySelector('#task-title')
    titleInput.value = ''
    titleInput.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()

    const form = document.body.querySelector('form')
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('button order is correct: Créer first, Annuler second', async () => {
    wrapper = mount(TaskModal, {
      props: {
        isOpen: true,
        columnId: 'col1',
        position: 0,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()
    const buttons = document.body.querySelectorAll('.modal-actions button')
    expect(buttons.length).toBe(2)
    // First button should be primary (Créer)
    expect(buttons[0].classList.contains('btn-primary')).toBe(true)
    expect(buttons[0].textContent.trim()).toContain('Créer')
    // Second button should be secondary (Annuler)
    expect(buttons[1].classList.contains('btn-secondary')).toBe(true)
    expect(buttons[1].textContent.trim()).toContain('Annuler')
  })
})
