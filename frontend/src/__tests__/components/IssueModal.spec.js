import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import IssueModal from '../../components/backlog/IssueModal.vue'

describe('IssueModal', () => {
  let wrapper

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('renders and accepts props correctly', () => {
    wrapper = mount(IssueModal, {
      props: {
        show: true,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    expect(wrapper.props('show')).toBe(true)
    expect(wrapper.props('availableSprints')).toEqual([])
  })

  it('displays modal when show is true', () => {
    wrapper = mount(IssueModal, {
      props: {
        show: true,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    const modal = document.body.querySelector('.modal-overlay')
    expect(modal).toBeTruthy()
  })

  it('hides modal when show is false', () => {
    wrapper = mount(IssueModal, {
      props: {
        show: false,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    const modal = document.body.querySelector('.modal-overlay')
    expect(modal).toBeFalsy()
  })

  it('populates form when editing an issue without checklist', async () => {
    const issue = {
      _id: 'issue1',
      title: 'Test Issue',
      description: 'Test description',
      type: 'Bug',
      priority: 'High',
      sprintId: 'sprint1',
    }

    wrapper = mount(IssueModal, {
      props: {
        show: true,
        issue,
        availableSprints: [{ _id: 'sprint1', name: 'Sprint 1' }],
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    const titleInput = document.body.querySelector('input[placeholder="Titre de l\'issue"]')
    const descriptionInput = document.body.querySelector('textarea[placeholder="Description"]')

    expect(titleInput.value).toBe('Test Issue')
    expect(descriptionInput.value).toBe('Test description')
  })

  it('populates form when editing an issue with checklist', async () => {
    const issue = {
      _id: 'issue1',
      title: 'Issue with tasks',
      description: 'Description',
      type: 'Task',
      priority: 'Medium',
      sprintId: null,
      checklist: [
        { id: '1', text: 'Task 1', checked: true },
        { id: '2', text: 'Task 2', checked: false },
      ],
    }

    wrapper = mount(IssueModal, {
      props: {
        show: true,
        issue,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.checklist.length).toBe(2)
    expect(wrapper.vm.form.checklist[0].text).toBe('Task 1')
    expect(wrapper.vm.form.checklist[0].checked).toBe(true)
    expect(wrapper.vm.form.checklist[1].text).toBe('Task 2')
    expect(wrapper.vm.form.checklist[1].checked).toBe(false)
  })

  it('handles issue with MongoDB _id in checklist items', async () => {
    const issue = {
      _id: 'issue1',
      title: 'Issue with MongoDB IDs',
      description: 'Test',
      type: 'Task',
      priority: 'Medium',
      checklist: [
        { _id: 'mongo-id-1', id: '1', text: 'Task 1', checked: true },
        { _id: 'mongo-id-2', id: '2', text: 'Task 2', checked: false },
      ],
    }

    wrapper = mount(IssueModal, {
      props: {
        show: true,
        issue,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.checklist.length).toBe(2)
    expect(wrapper.vm.form.checklist[0]._id).toBe('mongo-id-1')
    expect(wrapper.vm.form.checklist[0].text).toBe('Task 1')
  })

  it('adds new checklist item', async () => {
    wrapper = mount(IssueModal, {
      props: {
        show: true,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    const addButton = document.body.querySelector('.btn-add-checklist')
    addButton.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.checklist.length).toBe(1)
    expect(wrapper.vm.form.checklist[0]).toHaveProperty('id')
    expect(wrapper.vm.form.checklist[0]).toHaveProperty('text')
    expect(wrapper.vm.form.checklist[0]).toHaveProperty('checked')
  })

  it('removes checklist item', async () => {
    const issue = {
      _id: 'issue1',
      title: 'Test',
      checklist: [
        { id: '1', text: 'Task 1', checked: false },
        { id: '2', text: 'Task 2', checked: false },
      ],
    }

    wrapper = mount(IssueModal, {
      props: {
        show: true,
        issue,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.checklist.length).toBe(2)

    const removeButtons = document.body.querySelectorAll('.btn-remove')
    removeButtons[0].click()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.checklist.length).toBe(1)
    expect(wrapper.vm.form.checklist[0].id).toBe('2')
  })

  it('updates checklist item text', async () => {
    const issue = {
      _id: 'issue1',
      title: 'Test',
      checklist: [{ id: '1', text: 'Original text', checked: false }],
    }

    wrapper = mount(IssueModal, {
      props: {
        show: true,
        issue,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    const checklistInput = document.body.querySelector('.checklist-text')
    checklistInput.value = 'Updated text'
    checklistInput.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.checklist[0].text).toBe('Updated text')
  })

  it('toggles checklist item checked state', async () => {
    const issue = {
      _id: 'issue1',
      title: 'Test',
      checklist: [{ id: '1', text: 'Task 1', checked: false }],
    }

    wrapper = mount(IssueModal, {
      props: {
        show: true,
        issue,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    const checkbox = document.body.querySelector('input[type="checkbox"]')
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.checklist[0].checked).toBe(true)
  })

  it('emits save with updated checklist', async () => {
    const issue = {
      _id: 'issue1',
      title: 'Test Issue',
      description: 'Description',
      type: 'Task',
      priority: 'Medium',
      checklist: [
        { id: '1', text: 'Task 1', checked: false },
        { id: '2', text: 'Task 2', checked: true },
      ],
    }

    wrapper = mount(IssueModal, {
      props: {
        show: true,
        issue,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    // Modifier une tâche
    wrapper.vm.form.checklist[0].text = 'Updated Task 1'
    wrapper.vm.form.checklist[0].checked = true

    // Ajouter une nouvelle tâche
    wrapper.vm.form.checklist.push({ id: '3', text: 'New Task', checked: false })

    const saveButton = document.body.querySelector('.btn-primary')
    saveButton.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('save')).toBeTruthy()
    const savedData = wrapper.emitted('save')[0][0]
    expect(savedData.checklist.length).toBe(3)
    expect(savedData.checklist[0].text).toBe('Updated Task 1')
    expect(savedData.checklist[0].checked).toBe(true)
    expect(savedData.checklist[2].text).toBe('New Task')
  })

  it('validates required title field', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    wrapper = mount(IssueModal, {
      props: {
        show: true,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    const saveButton = document.body.querySelector('.btn-primary')
    saveButton.click()
    await wrapper.vm.$nextTick()

    expect(alertSpy).toHaveBeenCalledWith("Le titre de l'issue est obligatoire.")
    expect(wrapper.emitted('save')).toBeFalsy()

    alertSpy.mockRestore()
  })

  it('emits close when clicking overlay', async () => {
    wrapper = mount(IssueModal, {
      props: {
        show: true,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    const overlay = document.body.querySelector('.modal-overlay')
    overlay.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close when clicking cancel button', async () => {
    wrapper = mount(IssueModal, {
      props: {
        show: true,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    const cancelButton = document.body.querySelector('.btn-secondary')
    cancelButton.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('resets form when modal closes after creation', async () => {
    wrapper = mount(IssueModal, {
      props: {
        show: true,
        availableSprints: [],
      },
      attachTo: document.body,
    })

    // Remplir le formulaire
    wrapper.vm.form.title = 'Test'
    wrapper.vm.form.description = 'Description'
    wrapper.vm.form.checklist.push({ id: '1', text: 'Task', checked: false })

    // Fermer le modal
    await wrapper.setProps({ show: false })
    await wrapper.vm.$nextTick()

    // Réouvrir le modal
    await wrapper.setProps({ show: true })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.title).toBe('')
    expect(wrapper.vm.form.description).toBe('')
    expect(wrapper.vm.form.checklist.length).toBe(0)
  })

  it('handles all issue types correctly', async () => {
    const types = ['Task', 'Bug', 'Feature']

    for (const type of types) {
      const issue = {
        _id: 'issue1',
        title: 'Test',
        type,
        priority: 'Medium',
      }

      if (wrapper) wrapper.unmount()

      wrapper = mount(IssueModal, {
        props: {
          show: true,
          issue,
          availableSprints: [],
        },
        attachTo: document.body,
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.vm.form.type).toBe(type)
    }
  })

  it('handles all priority levels correctly', async () => {
    const priorities = ['Low', 'Medium', 'High']

    for (const priority of priorities) {
      const issue = {
        _id: 'issue1',
        title: 'Test',
        type: 'Task',
        priority,
      }

      if (wrapper) wrapper.unmount()

      wrapper = mount(IssueModal, {
        props: {
          show: true,
          issue,
          availableSprints: [],
        },
        attachTo: document.body,
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.vm.form.priority).toBe(priority)
    }
  })

  it('handles sprint assignment correctly', async () => {
    const sprints = [
      { _id: 'sprint1', name: 'Sprint 1' },
      { _id: 'sprint2', name: 'Sprint 2' },
    ]

    const issue = {
      _id: 'issue1',
      title: 'Test',
      type: 'Task',
      priority: 'Medium',
      sprintId: 'sprint2',
    }

    wrapper = mount(IssueModal, {
      props: {
        show: true,
        issue,
        availableSprints: sprints,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.sprintId).toBe('sprint2')
  })

  it('allows changing sprint to null (move to backlog)', async () => {
    const issue = {
      _id: 'issue1',
      title: 'Test',
      type: 'Task',
      priority: 'Medium',
      sprintId: 'sprint1',
    }

    wrapper = mount(IssueModal, {
      props: {
        show: true,
        issue,
        availableSprints: [{ _id: 'sprint1', name: 'Sprint 1' }],
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    wrapper.vm.form.sprintId = null

    const saveButton = document.body.querySelector('.btn-primary')
    saveButton.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0].sprintId).toBe(null)
  })
})
