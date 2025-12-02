import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import SprintModal from '../../components/backlog/SprintModal.vue'

describe('SprintModal', () => {
  let wrapper

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('renders and accepts props correctly', () => {
    wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    expect(wrapper.props('show')).toBe(true)
    expect(wrapper.props('availableIssues')).toEqual([])
  })

  it('displays modal when show is true', () => {
    wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    const modal = document.body.querySelector('.modal-overlay')
    expect(modal).toBeTruthy()
  })

  it('hides modal when show is false', () => {
    wrapper = mount(SprintModal, {
      props: {
        show: false,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    const modal = document.body.querySelector('.modal-overlay')
    expect(modal).toBeFalsy()
  })

  it('populates form when editing a sprint', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20T00:00:00.000Z',
      endDate: '2025-11-27T00:00:00.000Z',
      objective: 'Test objective',
      issues: [],
    }

    wrapper = mount(SprintModal, {
      props: {
        show: true,
        sprint,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.name).toBe('Sprint 1')
    expect(wrapper.vm.form.startDate).toBe('2025-11-20')
    expect(wrapper.vm.form.endDate).toBe('2025-11-27')
    expect(wrapper.vm.form.objective).toBe('Test objective')
  })

  it('populates selected issues when editing a sprint with issues as IDs', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: ['issue1', 'issue2'],
    }

    wrapper = mount(SprintModal, {
      props: {
        show: true,
        sprint,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedIssueIds).toEqual(['issue1', 'issue2'])
  })

  it('populates selected issues when editing a sprint with issues as objects', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: [
        { _id: 'issue1', title: 'Issue 1' },
        { _id: 'issue2', title: 'Issue 2' },
      ],
    }

    wrapper = mount(SprintModal, {
      props: {
        show: true,
        sprint,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedIssueIds).toEqual(['issue1', 'issue2'])
  })

  it('displays available issues with checkboxes', async () => {
    const issues = [
      {
        _id: 'issue1',
        title: 'Issue 1',
        type: 'Task',
        priority: 'High',
      },
      {
        _id: 'issue2',
        title: 'Issue 2',
        type: 'Bug',
        priority: 'Medium',
      },
    ]

    wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: issues,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    const checkboxes = document.body.querySelectorAll('.issue-checkbox input[type="checkbox"]')
    expect(checkboxes.length).toBe(2)
  })

  it('allows selecting and deselecting issues', async () => {
    const issues = [
      {
        _id: 'issue1',
        title: 'Issue 1',
        type: 'Task',
        priority: 'High',
      },
      {
        _id: 'issue2',
        title: 'Issue 2',
        type: 'Bug',
        priority: 'Medium',
      },
    ]

    wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: issues,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    const checkboxes = document.body.querySelectorAll('.issue-checkbox input[type="checkbox"]')

    // Sélectionner la première issue
    checkboxes[0].checked = true
    checkboxes[0].dispatchEvent(new Event('change'))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedIssueIds).toContain('issue1')

    // Sélectionner la deuxième issue
    checkboxes[1].checked = true
    checkboxes[1].dispatchEvent(new Event('change'))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedIssueIds).toContain('issue2')
    expect(wrapper.vm.selectedIssueIds.length).toBe(2)

    // Désélectionner la première issue
    checkboxes[0].checked = false
    checkboxes[0].dispatchEvent(new Event('change'))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedIssueIds).not.toContain('issue1')
    expect(wrapper.vm.selectedIssueIds).toContain('issue2')
  })

  it('adds issues to an existing sprint', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: ['issue1'],
    }

    const issues = [
      { _id: 'issue1', title: 'Issue 1', type: 'Task', priority: 'High' },
      { _id: 'issue2', title: 'Issue 2', type: 'Bug', priority: 'Medium' },
      { _id: 'issue3', title: 'Issue 3', type: 'Feature', priority: 'Low' },
    ]

    wrapper = mount(SprintModal, {
      props: {
        show: true,
        sprint,
        availableIssues: issues,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedIssueIds).toEqual(['issue1'])

    // Ajouter issue2 et issue3
    wrapper.vm.selectedIssueIds.push('issue2', 'issue3')

    const saveButton = document.body.querySelector('.btn-primary')
    saveButton.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('save')).toBeTruthy()
    const savedData = wrapper.emitted('save')[0][0]
    expect(savedData.issues).toEqual(['issue1', 'issue2', 'issue3'])
  })

  it('removes issues from an existing sprint', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: ['issue1', 'issue2', 'issue3'],
    }

    const issues = [
      { _id: 'issue1', title: 'Issue 1', type: 'Task', priority: 'High' },
      { _id: 'issue2', title: 'Issue 2', type: 'Bug', priority: 'Medium' },
      { _id: 'issue3', title: 'Issue 3', type: 'Feature', priority: 'Low' },
    ]

    wrapper = mount(SprintModal, {
      props: {
        show: true,
        sprint,
        availableIssues: issues,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedIssueIds).toEqual(['issue1', 'issue2', 'issue3'])

    // Retirer issue2
    wrapper.vm.selectedIssueIds = ['issue1', 'issue3']

    const saveButton = document.body.querySelector('.btn-primary')
    saveButton.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('save')).toBeTruthy()
    const savedData = wrapper.emitted('save')[0][0]
    expect(savedData.issues).toEqual(['issue1', 'issue3'])
  })

  it('validates required name field', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    const saveButton = document.body.querySelector('.btn-primary')
    saveButton.click()
    await wrapper.vm.$nextTick()

    expect(alertSpy).toHaveBeenCalledWith('Le nom du sprint est obligatoire.')
    expect(wrapper.emitted('save')).toBeFalsy()

    alertSpy.mockRestore()
  })

  it('emits close when clicking overlay', async () => {
    wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    const overlay = document.body.querySelector('.modal-overlay')
    overlay.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close when clicking cancel button', async () => {
    wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    const cancelButton = document.body.querySelector('.btn-secondary')
    cancelButton.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('resets form when modal closes after creation', async () => {
    wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    // Remplir le formulaire
    wrapper.vm.form.name = 'Test Sprint'
    wrapper.vm.form.startDate = '2025-12-01'
    wrapper.vm.form.endDate = '2025-12-15'
    wrapper.vm.form.objective = 'Test objective'
    wrapper.vm.selectedIssueIds = ['issue1', 'issue2']

    // Fermer le modal
    await wrapper.setProps({ show: false })
    await wrapper.vm.$nextTick()

    // Réouvrir le modal
    await wrapper.setProps({ show: true })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.form.name).toBe('')
    expect(wrapper.vm.form.startDate).toBe('')
    expect(wrapper.vm.form.endDate).toBe('')
    expect(wrapper.vm.form.objective).toBe('')
    expect(wrapper.vm.selectedIssueIds).toEqual([])
  })

  it('updates sprint dates correctly', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: [],
    }

    wrapper = mount(SprintModal, {
      props: {
        show: true,
        sprint,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    wrapper.vm.form.startDate = '2025-12-01'
    wrapper.vm.form.endDate = '2025-12-15'

    const saveButton = document.body.querySelector('.btn-primary')
    saveButton.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('save')).toBeTruthy()
    const savedData = wrapper.emitted('save')[0][0]
    expect(savedData.startDate).toBe('2025-12-01')
    expect(savedData.endDate).toBe('2025-12-15')
  })

  it('displays "no issues" message when no issues available', () => {
    wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    const noIssuesMessage = document.body.querySelector('.no-issues')
    expect(noIssuesMessage).toBeTruthy()
    expect(noIssuesMessage.textContent).toContain('Aucune issue disponible')
  })

  it('displays issues list when issues are available', () => {
    const issues = [{ _id: 'issue1', title: 'Issue 1', type: 'Task', priority: 'High' }]

    wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: issues,
      },
      attachTo: document.body,
    })

    const issuesList = document.body.querySelector('.modal-issues-list')
    expect(issuesList).toBeTruthy()

    const noIssuesMessage = document.body.querySelector('.no-issues')
    expect(noIssuesMessage).toBeFalsy()
  })

  it('handles empty objective field', async () => {
    wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: [],
      },
      attachTo: document.body,
    })

    wrapper.vm.form.name = 'Sprint without objective'
    wrapper.vm.form.startDate = '2025-12-01'
    wrapper.vm.form.endDate = '2025-12-15'

    const saveButton = document.body.querySelector('.btn-primary')
    saveButton.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('save')).toBeTruthy()
    const savedData = wrapper.emitted('save')[0][0]
    expect(savedData.objective).toBe('')
  })

  it('displays issue badges correctly in the list', () => {
    const issues = [
      { _id: 'issue1', title: 'High Priority Bug', type: 'Bug', priority: 'High' },
      { _id: 'issue2', title: 'Medium Task', type: 'Task', priority: 'Medium' },
      { _id: 'issue3', title: 'Low Feature', type: 'Feature', priority: 'Low' },
    ]

    wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: issues,
      },
      attachTo: document.body,
    })

    const typeBadges = document.body.querySelectorAll('.badge.type')
    expect(typeBadges.length).toBe(3)
    expect(typeBadges[0].textContent).toBe('Bug')
    expect(typeBadges[1].textContent).toBe('Task')
    expect(typeBadges[2].textContent).toBe('Feature')

    const priorityBadges = document.body.querySelectorAll('.badge.priority')
    expect(priorityBadges.length).toBe(3)
    expect(priorityBadges[0].classList.contains('high')).toBe(true)
    expect(priorityBadges[1].classList.contains('medium')).toBe(true)
    expect(priorityBadges[2].classList.contains('low')).toBe(true)
  })
})
