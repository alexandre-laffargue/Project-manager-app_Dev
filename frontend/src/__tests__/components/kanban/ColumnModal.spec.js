import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach } from 'vitest'
import ColumnModal from '../../../components/kanban/ColumnModal.vue'

describe('ColumnModal', () => {
  let wrapper

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('renders correctly when open in create mode', async () => {
    wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('.modal-overlay')).toBeTruthy()
    expect(document.body.textContent).toContain('Nouvelle colonne')
    expect(document.body.querySelector('#column-title')).toBeTruthy()
  })

  it('does not render when closed', () => {
    wrapper = mount(ColumnModal, {
      props: {
        isOpen: false,
      },
      attachTo: document.body,
    })

    expect(document.body.querySelector('.modal-overlay')).toBeFalsy()
  })

  it('renders in edit mode when column prop is provided', async () => {
    const column = {
      title: 'Existing Column',
    }

    wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
        column,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    expect(document.body.textContent).toContain('Modifier la colonne')
    expect(document.body.querySelector('#column-title').value).toBe('Existing Column')
  })

  it('emits close event when close button is clicked', async () => {
    wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
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
    wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
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

  it('emits submit event with title when form is submitted in create mode', async () => {
    wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    const titleInput = document.body.querySelector('#column-title')
    titleInput.value = 'New Column'
    titleInput.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()

    const form = document.body.querySelector('form')
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toEqual({
      title: 'New Column',
    })
  })

  it('emits submit event with updated title in edit mode', async () => {
    const column = {
      title: 'Old Title',
    }

    wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
        column,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    const titleInput = document.body.querySelector('#column-title')
    titleInput.value = 'Updated Title'
    titleInput.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()

    const form = document.body.querySelector('form')
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toEqual({
      title: 'Updated Title',
    })
  })

  it('does not submit when title is empty', async () => {
    wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
      },
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    const titleInput = document.body.querySelector('#column-title')
    titleInput.value = ''
    titleInput.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()

    const form = document.body.querySelector('form')
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('button order is correct: Créer first, Annuler second', async () => {
    wrapper = mount(ColumnModal, {
      props: {
        isOpen: true,
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
