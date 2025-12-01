import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ColumnModal from '../../../components/kanban/ColumnModal.vue'

describe('ColumnModal', () => {
  it('renders correctly when open in create mode', () => {
    const wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
      },
    })

    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nouvelle colonne')
    expect(wrapper.find('#column-title').exists()).toBe(true)
  })

  it('does not render when closed', () => {
    const wrapper = mount(ColumnModal, {
      props: {
        isOpen: false,
      },
    })

    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('renders in edit mode when column prop is provided', async () => {
    const column = {
      _id: 'col1',
      title: 'Existing Column',
    }

    const wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
        column,
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Modifier la colonne')
    expect(wrapper.find('#column-title').element.value).toBe('Existing Column')
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
      },
    })

    await wrapper.find('.close-btn').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close event when Annuler button is clicked', async () => {
    const wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
      },
    })

    const buttons = wrapper.findAll('.modal-actions button')
    // Annuler is the second button (index 1)
    await buttons[1].trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits submit event with title when form is submitted in create mode', async () => {
    const wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
      },
    })

    await wrapper.find('#column-title').setValue('New Column')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeTruthy()
    const submitPayload = wrapper.emitted('submit')[0][0]
    expect(submitPayload).toEqual({ title: 'New Column' })
  })

  it('emits submit event with updated title in edit mode', async () => {
    const column = {
      _id: 'col1',
      title: 'Old Title',
    }

    const wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
        column,
      },
    })

    await wrapper.vm.$nextTick()
    await wrapper.find('#column-title').setValue('Updated Title')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeTruthy()
    const submitPayload = wrapper.emitted('submit')[0][0]
    expect(submitPayload).toEqual({ title: 'Updated Title' })
  })

  it('does not submit when title is empty', async () => {
    const wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
      },
    })

    await wrapper.find('#column-title').setValue('')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('button order is correct: Créer first, Annuler second', () => {
    const wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
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
