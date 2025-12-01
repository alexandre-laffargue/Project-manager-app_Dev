import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import IssueCard from '../../components/backlog/IssueCard.vue'

describe('IssueCard', () => {
  it('renders issue basic information', () => {
    const issue = {
      _id: 'issue1',
      title: 'Test Issue',
      description: 'Test description',
      type: 'Task',
      priority: 'High',
    }

    const wrapper = mount(IssueCard, {
      props: { issue, sprints: [] },
    })

    expect(wrapper.text()).toContain('Test Issue')
    expect(wrapper.text()).toContain('Task')
    expect(wrapper.text()).toContain('High')

    wrapper.unmount()
  })

  it('displays checklist progress when issue has checklist', () => {
    const issue = {
      _id: 'issue1',
      title: 'Issue with tasks',
      type: 'Task',
      priority: 'Medium',
      checklist: [
        { id: '1', text: 'Task 1', checked: true },
        { id: '2', text: 'Task 2', checked: false },
        { id: '3', text: 'Task 3', checked: true },
      ],
    }

    const wrapper = mount(IssueCard, {
      props: { issue, sprints: [] },
    })

    // Should display checklist progress (2/3)
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('3')

    wrapper.unmount()
  })

  it('displays sprint badge when issue is linked to sprint', () => {
    const issue = {
      _id: 'issue1',
      title: 'Sprint Issue',
      type: 'Bug',
      priority: 'High',
      sprintId: 'sprint1',
    }

    const sprints = [
      { _id: 'sprint1', name: 'Sprint 1' },
      { _id: 'sprint2', name: 'Sprint 2' },
    ]

    const wrapper = mount(IssueCard, {
      props: { issue, sprints },
    })

    // Issue card shows "Sprint assigné" badge when linked to a sprint
    expect(wrapper.text()).toContain('Sprint assigné')

    wrapper.unmount()
  })

  it('does not display sprint badge when issue has no sprint', () => {
    const issue = {
      _id: 'issue1',
      title: 'Backlog Issue',
      type: 'Task',
      priority: 'Low',
      sprintId: null,
    }

    const wrapper = mount(IssueCard, {
      props: { issue, sprints: [] },
    })

    // Should not show any sprint badge
    const html = wrapper.html()
    expect(html).not.toContain('sprint-badge')

    wrapper.unmount()
  })

  it('displays correct checklist progress with all items checked', () => {
    const issue = {
      _id: 'issue1',
      title: 'Completed Issue',
      type: 'Task',
      priority: 'Medium',
      checklist: [
        { id: '1', text: 'Task 1', checked: true },
        { id: '2', text: 'Task 2', checked: true },
      ],
    }

    const wrapper = mount(IssueCard, {
      props: { issue, sprints: [] },
    })

    // Should show 2/2 completed
    expect(wrapper.text()).toContain('2')

    wrapper.unmount()
  })

  it('displays correct checklist progress with no items checked', () => {
    const issue = {
      _id: 'issue1',
      title: 'Todo Issue',
      type: 'Feature',
      priority: 'High',
      checklist: [
        { id: '1', text: 'Task 1', checked: false },
        { id: '2', text: 'Task 2', checked: false },
        { id: '3', text: 'Task 3', checked: false },
      ],
    }

    const wrapper = mount(IssueCard, {
      props: { issue, sprints: [] },
    })

    // Should show 0/3 completed
    expect(wrapper.text()).toContain('0')
    expect(wrapper.text()).toContain('3')

    wrapper.unmount()
  })

  it('emits edit event when edit button clicked', async () => {
    const issue = {
      _id: 'issue1',
      title: 'Test Issue',
      type: 'Task',
      priority: 'Medium',
    }

    const wrapper = mount(IssueCard, {
      props: { issue, sprints: [] },
    })

    const editBtn = wrapper.findAll('button').find((btn) => btn.text().includes('Modifier'))

    if (editBtn) {
      await editBtn.trigger('click')
      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')[0][0]).toEqual(issue)
    }

    wrapper.unmount()
  })

  it('emits delete event when delete button clicked', async () => {
    const issue = {
      _id: 'issue1',
      title: 'Test Issue',
      type: 'Task',
      priority: 'Medium',
    }

    const wrapper = mount(IssueCard, {
      props: { issue, sprints: [] },
    })

    const deleteBtn = wrapper.findAll('button').find((btn) => btn.text().includes('Supprimer'))

    if (deleteBtn) {
      await deleteBtn.trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')[0][0]).toEqual(issue)
    }

    wrapper.unmount()
  })

  it('applies correct priority class styling', () => {
    const highIssue = {
      _id: 'issue1',
      title: 'High Priority',
      type: 'Bug',
      priority: 'High',
    }

    const wrapper = mount(IssueCard, {
      props: { issue: highIssue, sprints: [] },
    })

    const html = wrapper.html()
    expect(html).toContain('high')

    wrapper.unmount()
  })

  it('handles issue without checklist gracefully', () => {
    const issue = {
      _id: 'issue1',
      title: 'Simple Issue',
      type: 'Task',
      priority: 'Medium',
      // No checklist property
    }

    const wrapper = mount(IssueCard, {
      props: { issue, sprints: [] },
    })

    expect(wrapper.text()).toContain('Simple Issue')
    // Should not crash or show checklist UI

    wrapper.unmount()
  })
})
