import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBox from '@/components/SearchBox.vue'

describe('SearchBox', () => {
  it('renders input with placeholder', () => {
    const wrapper = mount(SearchBox, {
      props: { modelValue: '', placeholder: '搜索内容' }
    })
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('搜索内容')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(SearchBox, {
      props: { modelValue: '', placeholder: '搜索' }
    })
    await wrapper.find('input').setValue('hello')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['hello'])
  })
})
