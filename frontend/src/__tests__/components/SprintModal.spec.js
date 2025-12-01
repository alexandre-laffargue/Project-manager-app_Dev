import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import SprintModal from '../../components/backlog/SprintModal.vue'

describe('SprintModal', () => {
  it('renders and accepts props correctly', () => {
    const wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: []
      },
      attachTo: document.body
    })

    expect(wrapper.props('show')).toBe(true)
    expect(wrapper.props('availableIssues')).toEqual([])
    
    wrapper.unmount()
  })

  it('accepts sprint prop when editing', () => {
    const sprint = {
      _id: 'sprint1',
      name: 'Sprint 1',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      objective: 'Test objective',
      issues: ['issue1', 'issue2']
    }

    const wrapper = mount(SprintModal, {
      props: {
        show: true,
        sprint,
        availableIssues: []
      },
      attachTo: document.body
    })

    expect(wrapper.props('sprint')).toEqual(sprint)
    
    wrapper.unmount()
  })

  it('emits close event', async () => {
    const wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: []
      },
      attachTo: document.body
    })

    await wrapper.vm.$emit('close')
    expect(wrapper.emitted('close')).toBeTruthy()

    wrapper.unmount()
  })

  it('emits save event with data', async () => {
    const wrapper = mount(SprintModal, {
      props: {
        show: true,
        availableIssues: []
      },
      attachTo: document.body
    })

    const saveData = {
      name: 'New Sprint',
      startDate: '2025-12-01',
      endDate: '2025-12-15',
      objective: 'Test',
      issues: []
    }

    await wrapper.vm.$emit('save', saveData)
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0]).toEqual(saveData)

    wrapper.unmount()
  })
})
