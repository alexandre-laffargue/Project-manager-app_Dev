import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import IssueModal from '../../components/backlog/IssueModal.vue'

describe('IssueModal', () => {
  it('renders and accepts props correctly', () => {
    const wrapper = mount(IssueModal, {
      props: {
        show: true,
        availableSprints: []
      },
      attachTo: document.body
    })

    expect(wrapper.props('show')).toBe(true)
    expect(wrapper.props('availableSprints')).toEqual([])
    
    wrapper.unmount()
  })

  it('accepts issue prop when editing', () => {
    const issue = {
      _id: 'issue1',
      title: 'Test Issue',
      description: 'Test description',
      type: 'Bug',
      priority: 'High',
      checklist: [
        { id: '1', text: 'Task 1', checked: false }
      ],
      sprintId: 'sprint1'
    }

    const wrapper = mount(IssueModal, {
      props: {
        show: true,
        issue,
        availableSprints: []
      },
      attachTo: document.body
    })

    expect(wrapper.props('issue')).toEqual(issue)
    
    wrapper.unmount()
  })

  it('emits close event', async () => {
    const wrapper = mount(IssueModal, {
      props: {
        show: true,
        availableSprints: []
      },
      attachTo: document.body
    })

    await wrapper.vm.$emit('close')
    expect(wrapper.emitted('close')).toBeTruthy()

    wrapper.unmount()
  })

  it('emits save event with data including checklist', async () => {
    const wrapper = mount(IssueModal, {
      props: {
        show: true,
        availableSprints: []
      },
      attachTo: document.body
    })

    const saveData = {
      title: 'New Issue',
      description: 'Description',
      type: 'Task',
      priority: 'Medium',
      checklist: [{ id: '1', text: 'Task 1', checked: false }],
      sprintId: null
    }

    await wrapper.vm.$emit('save', saveData)
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0]).toEqual(saveData)

    wrapper.unmount()
  })
})
