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
      props: { issue },
    })

    expect(wrapper.text()).toContain('Test Issue')
    expect(wrapper.text()).toContain('Test description')
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
      props: { issue },
    })

    // Should display checklist progress (2/3)
    expect(wrapper.text()).toContain('2/3')
    const progressBar = wrapper.find('.progress-bar')
    expect(progressBar.exists()).toBe(true)

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

    const wrapper = mount(IssueCard, {
      props: { issue },
    })

    // Issue card shows "Sprint assigné" badge when linked to a sprint
    expect(wrapper.text()).toContain('Sprint assigné')
    expect(wrapper.find('.badge.sprint').exists()).toBe(true)

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
      props: { issue },
    })

    // Should not show any sprint badge
    expect(wrapper.find('.badge.sprint').exists()).toBe(false)

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
      props: { issue },
    })

    // Should show 2/2 completed and 100% progress
    expect(wrapper.text()).toContain('2/2')
    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 100%')

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
      props: { issue },
    })

    // Should show 0/3 completed and 0% progress
    expect(wrapper.text()).toContain('0/3')
    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 0%')

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
      props: { issue },
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
      props: { issue },
    })

    const deleteBtn = wrapper.findAll('button').find((btn) => btn.text().includes('Supprimer'))

    if (deleteBtn) {
      await deleteBtn.trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')[0][0]).toEqual(issue)
    }

    wrapper.unmount()
  })

  it('applies correct priority class styling for High', () => {
    const highIssue = {
      _id: 'issue1',
      title: 'High Priority',
      type: 'Bug',
      priority: 'High',
    }

    const wrapper = mount(IssueCard, {
      props: { issue: highIssue },
    })

    const priorityBadge = wrapper.find('.badge.priority')
    expect(priorityBadge.classes()).toContain('high')
    expect(priorityBadge.text()).toBe('High')

    wrapper.unmount()
  })

  it('applies correct priority class styling for Medium', () => {
    const mediumIssue = {
      _id: 'issue2',
      title: 'Medium Priority',
      type: 'Task',
      priority: 'Medium',
    }

    const wrapper = mount(IssueCard, {
      props: { issue: mediumIssue },
    })

    const priorityBadge = wrapper.find('.badge.priority')
    expect(priorityBadge.classes()).toContain('medium')
    expect(priorityBadge.text()).toBe('Medium')

    wrapper.unmount()
  })

  it('applies correct priority class styling for Low', () => {
    const lowIssue = {
      _id: 'issue3',
      title: 'Low Priority',
      type: 'Feature',
      priority: 'Low',
    }

    const wrapper = mount(IssueCard, {
      props: { issue: lowIssue },
    })

    const priorityBadge = wrapper.find('.badge.priority')
    expect(priorityBadge.classes()).toContain('low')
    expect(priorityBadge.text()).toBe('Low')

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
      props: { issue },
    })

    expect(wrapper.text()).toContain('Simple Issue')
    expect(wrapper.find('.checklist-preview').exists()).toBe(false)

    wrapper.unmount()
  })

  it('handles issue with empty checklist array', () => {
    const issue = {
      _id: 'issue1',
      title: 'Issue with empty checklist',
      type: 'Task',
      priority: 'Medium',
      checklist: [],
    }

    const wrapper = mount(IssueCard, {
      props: { issue },
    })

    expect(wrapper.text()).toContain('Issue with empty checklist')
    expect(wrapper.find('.checklist-preview').exists()).toBe(false)

    wrapper.unmount()
  })

  it('handles issue with undefined description', () => {
    const issue = {
      _id: 'issue1',
      title: 'Issue without description',
      type: 'Task',
      priority: 'Medium',
    }

    const wrapper = mount(IssueCard, {
      props: { issue },
    })

    expect(wrapper.text()).toContain('Issue without description')
    // Should not crash

    wrapper.unmount()
  })

  it('handles issue with empty description', () => {
    const issue = {
      _id: 'issue1',
      title: 'Issue with empty description',
      description: '',
      type: 'Task',
      priority: 'Medium',
    }

    const wrapper = mount(IssueCard, {
      props: { issue },
    })

    expect(wrapper.text()).toContain('Issue with empty description')

    wrapper.unmount()
  })

  it('displays all three issue types correctly', () => {
    const taskIssue = {
      _id: 'issue1',
      title: 'Task Issue',
      type: 'Task',
      priority: 'Medium',
    }

    const wrapper1 = mount(IssueCard, { props: { issue: taskIssue } })
    expect(wrapper1.find('.badge.type').text()).toBe('Task')
    wrapper1.unmount()

    const bugIssue = {
      _id: 'issue2',
      title: 'Bug Issue',
      type: 'Bug',
      priority: 'High',
    }

    const wrapper2 = mount(IssueCard, { props: { issue: bugIssue } })
    expect(wrapper2.find('.badge.type').text()).toBe('Bug')
    wrapper2.unmount()

    const featureIssue = {
      _id: 'issue3',
      title: 'Feature Issue',
      type: 'Feature',
      priority: 'Low',
    }

    const wrapper3 = mount(IssueCard, { props: { issue: featureIssue } })
    expect(wrapper3.find('.badge.type').text()).toBe('Feature')
    wrapper3.unmount()
  })

  it('calculates progress percentage correctly for partial completion', () => {
    const issue = {
      _id: 'issue1',
      title: 'Partial completion',
      type: 'Task',
      priority: 'Medium',
      checklist: [
        { id: '1', text: 'Task 1', checked: true },
        { id: '2', text: 'Task 2', checked: false },
        { id: '3', text: 'Task 3', checked: false },
        { id: '4', text: 'Task 4', checked: false },
      ],
    }

    const wrapper = mount(IssueCard, {
      props: { issue },
    })

    // 1/4 = 25%
    expect(wrapper.text()).toContain('1/4')
    const progressFill = wrapper.find('.progress-fill')
    expect(progressFill.attributes('style')).toContain('width: 25%')

    wrapper.unmount()
  })

  it('handles checklist with MongoDB _id field', () => {
    const issue = {
      _id: 'issue1',
      title: 'Issue with MongoDB IDs',
      type: 'Task',
      priority: 'Medium',
      checklist: [
        { _id: 'mongo-id-1', id: '1', text: 'Task 1', checked: true },
        { _id: 'mongo-id-2', id: '2', text: 'Task 2', checked: false },
      ],
    }

    const wrapper = mount(IssueCard, {
      props: { issue },
    })

    // Should handle MongoDB _id field without issues
    expect(wrapper.text()).toContain('1/2')
    expect(wrapper.find('.checklist-preview').exists()).toBe(true)

    wrapper.unmount()
  })

  it('renders both edit and delete buttons', () => {
    const issue = {
      _id: 'issue1',
      title: 'Test Issue',
      type: 'Task',
      priority: 'Medium',
    }

    const wrapper = mount(IssueCard, {
      props: { issue },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(2)

    const editBtn = buttons.find((btn) => btn.text().includes('Modifier'))
    const deleteBtn = buttons.find((btn) => btn.text().includes('Supprimer'))

    expect(editBtn).toBeDefined()
    expect(deleteBtn).toBeDefined()

    wrapper.unmount()
  })

  it('displays checklist icon when checklist exists', () => {
    const issue = {
      _id: 'issue1',
      title: 'Issue with checklist',
      type: 'Task',
      priority: 'Medium',
      checklist: [{ id: '1', text: 'Task 1', checked: false }],
    }

    const wrapper = mount(IssueCard, {
      props: { issue },
    })

    expect(wrapper.find('.checklist-icon').exists()).toBe(true)
    expect(wrapper.find('.checklist-icon').text()).toBe('✓')

    wrapper.unmount()
  })

  it('handles long titles and descriptions gracefully', () => {
    const issue = {
      _id: 'issue1',
      title: 'A'.repeat(200),
      description: 'B'.repeat(500),
      type: 'Task',
      priority: 'Medium',
    }

    const wrapper = mount(IssueCard, {
      props: { issue },
    })

    expect(wrapper.find('h4').text()).toBe('A'.repeat(200))
    expect(wrapper.find('p').text()).toBe('B'.repeat(500))

    wrapper.unmount()
  })

  it('handles special characters in title and description', () => {
    const issue = {
      _id: 'issue1',
      title: '<script>alert("xss")</script>',
      description: 'Test & "quotes" and \'apostrophes\'',
      type: 'Task',
      priority: 'Medium',
    }

    const wrapper = mount(IssueCard, {
      props: { issue },
    })

    // Vue should escape HTML by default
    const html = wrapper.html()
    expect(html).not.toContain('<script>')
    expect(wrapper.text()).toContain('alert')

    wrapper.unmount()
  })
})
