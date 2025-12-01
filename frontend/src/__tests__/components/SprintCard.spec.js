import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SprintCard from '../../components/backlog/SprintCard.vue'

describe('SprintCard', () => {
  it('renders sprint basic information', () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Complete features',
      issues: []
    }

    const wrapper = mount(SprintCard, {
      props: { sprint, allIssues: [] }
    })

    expect(wrapper.text()).toContain('Sprint 1')
    expect(wrapper.text()).toContain('Complete features')

    wrapper.unmount()
  })

  it('displays correct issue count', () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: ['issue1', 'issue2', 'issue3']
    }

    const allIssues = [
      { _id: 'issue1', title: 'Issue 1', sprintId: 'sprint1' },
      { _id: 'issue2', title: 'Issue 2', sprintId: 'sprint1' },
      { _id: 'issue3', title: 'Issue 3', sprintId: 'sprint1' }
    ]

    const wrapper = mount(SprintCard, {
      props: { sprint, allIssues }
    })

    expect(wrapper.text()).toContain('3 issues')

    wrapper.unmount()
  })

  it('displays singular "issue" for single issue', () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: ['issue1']
    }

    const allIssues = [
      { _id: 'issue1', title: 'Issue 1', sprintId: 'sprint1' }
    ]

    const wrapper = mount(SprintCard, {
      props: { sprint, allIssues }
    })

    // Should show 1 issue in the badge
    expect(wrapper.text()).toContain('1 issue')

    wrapper.unmount()
  })

  it('toggles issue accordion when clicking view button', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: ['issue1']
    }

    const allIssues = [
      { _id: 'issue1', title: 'Test Issue', type: 'Task', priority: 'High', sprintId: 'sprint1' }
    ]

    const wrapper = mount(SprintCard, {
      props: { sprint, allIssues }
    })

    // Initially hidden
    expect(wrapper.find('.sprint-issues').exists()).toBe(false)

    // Click view issues button
    const viewBtn = wrapper.find('.btn-view-issues')
    await viewBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Should be visible
    expect(wrapper.find('.sprint-issues').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Issue')

    wrapper.unmount()
  })

  it('displays linked issues correctly in accordion', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: ['issue1', 'issue2']
    }

    const allIssues = [
      { _id: 'issue1', title: 'First Issue', type: 'Task', priority: 'High', sprintId: 'sprint1' },
      { _id: 'issue2', title: 'Second Issue', type: 'Bug', priority: 'Medium', sprintId: 'sprint1' },
      { _id: 'issue3', title: 'Other Issue', type: 'Feature', priority: 'Low', sprintId: 'sprint2' }
    ]

    const wrapper = mount(SprintCard, {
      props: { sprint, allIssues }
    })

    // Expand accordion
    const viewBtn = wrapper.find('.btn-view-issues')
    await viewBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Should show only linked issues
    expect(wrapper.text()).toContain('First Issue')
    expect(wrapper.text()).toContain('Second Issue')
    expect(wrapper.text()).not.toContain('Other Issue')

    wrapper.unmount()
  })

  it('shows message when sprint has no linked issues', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Empty Sprint',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: []
    }

    const wrapper = mount(SprintCard, {
      props: { sprint, allIssues: [] }
    })

    // Expand accordion
    const viewBtn = wrapper.find('.btn-view-issues')
    await viewBtn.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Aucune issue liée')

    wrapper.unmount()
  })

  it('emits edit event when edit button clicked', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: []
    }

    const wrapper = mount(SprintCard, {
      props: { sprint, allIssues: [] }
    })

    const editBtn = wrapper.find('.btn-edit')
    await editBtn.trigger('click')

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0][0]).toEqual(sprint)

    wrapper.unmount()
  })

  it('emits delete event when delete button clicked', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: []
    }

    const wrapper = mount(SprintCard, {
      props: { sprint, allIssues: [] }
    })

    const deleteBtn = wrapper.find('.btn-delete')
    await deleteBtn.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0][0]).toEqual(sprint)

    wrapper.unmount()
  })

  it('formats dates correctly', () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-12-01',
      endDate: '2025-12-15',
      objective: 'Test',
      issues: []
    }

    const wrapper = mount(SprintCard, {
      props: { sprint, allIssues: [] }
    })

    // Should display formatted dates
    expect(wrapper.text()).toContain('01/12/2025')
    expect(wrapper.text()).toContain('15/12/2025')

    wrapper.unmount()
  })

  it('displays default objective when none is set', () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: '',
      issues: []
    }

    const wrapper = mount(SprintCard, {
      props: { sprint, allIssues: [] }
    })

    expect(wrapper.text()).toContain('Aucun objectif défini')

    wrapper.unmount()
  })

  it('changes button text when accordion is toggled', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: []
    }

    const wrapper = mount(SprintCard, {
      props: { sprint, allIssues: [] }
    })

    const viewBtn = wrapper.find('.btn-view-issues')
    
    // Initially shows "Voir"
    expect(viewBtn.text()).toContain('Voir')

    // Click to expand
    await viewBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Should show "Masquer"
    expect(viewBtn.text()).toContain('Masquer')

    wrapper.unmount()
  })

  it('filters issues by sprintId matching sprint._id', async () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test',
      issues: ['issue1', 'issue2']
    }

    const allIssues = [
      { _id: 'issue1', title: 'Linked 1', type: 'Task', priority: 'High', sprintId: 'sprint1' },
      { _id: 'issue2', title: 'Linked 2', type: 'Bug', priority: 'Medium', sprintId: 'sprint1' },
      { _id: 'issue3', title: 'Not Linked', type: 'Feature', priority: 'Low', sprintId: null },
      { _id: 'issue4', title: 'Other Sprint', type: 'Task', priority: 'High', sprintId: 'sprint2' }
    ]

    const wrapper = mount(SprintCard, {
      props: { sprint, allIssues }
    })

    // Expand accordion
    const viewBtn = wrapper.find('.btn-view-issues')
    await viewBtn.trigger('click')
    await wrapper.vm.$nextTick()

    const issuesSection = wrapper.find('.sprint-issues')
    
    // Should only show issues with matching sprintId
    expect(issuesSection.text()).toContain('Linked 1')
    expect(issuesSection.text()).toContain('Linked 2')
    expect(issuesSection.text()).not.toContain('Not Linked')
    expect(issuesSection.text()).not.toContain('Other Sprint')

    wrapper.unmount()
  })
})
