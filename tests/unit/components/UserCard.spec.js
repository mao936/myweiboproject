import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import UserCard from '@/components/UserCard.vue'

describe('UserCard', () => {
  it('renders default avatar and name', () => {
    const wrapper = mount(UserCard, {
      props: { name: '测试用户', avatarUrl: '' }
    })
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('input.user-name').element.value).toBe('测试用户')
  })

  it('renders provided avatar url', () => {
    const wrapper = mount(UserCard, {
      props: { name: '我', avatarUrl: 'blob:avatar' }
    })
    expect(wrapper.find('img').attributes('src')).toBe('blob:avatar')
  })

  it('emits update:name when name input changes', async () => {
    const wrapper = mount(UserCard, {
      props: { name: '我', avatarUrl: '' }
    })
    const input = wrapper.find('input.user-name')
    await input.setValue('新昵称')
    expect(wrapper.emitted('update:name')).toHaveLength(1)
    expect(wrapper.emitted('update:name')[0]).toEqual(['新昵称'])
  })

  it('does not emit update:name when name is empty', async () => {
    const wrapper = mount(UserCard, {
      props: { name: '我', avatarUrl: '' }
    })
    const input = wrapper.find('input.user-name')
    await input.setValue('')
    expect(wrapper.emitted('update:name')).toBeFalsy()
  })

  it('emits update:avatar when avatar file selected', async () => {
    global.URL.createObjectURL = vi.fn(() => 'blob:new-avatar')
    const wrapper = mount(UserCard, {
      props: { name: '我', avatarUrl: '' }
    })
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })
    await input.trigger('change')
    await nextTick()
    expect(wrapper.emitted('update:avatar')).toHaveLength(1)
    expect(wrapper.emitted('update:avatar')[0][0]).toBe(file)
  })
})
