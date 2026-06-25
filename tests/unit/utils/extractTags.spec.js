import { describe, it, expect } from 'vitest'
import { extractTags } from '@/utils/extractTags'

describe('extractTags', () => {
  it('should extract hashtag tags', () => {
    const content = '今天去了#西湖，风景真美 #旅行'
    const tags = extractTags(content)
    expect(tags).toContain('西湖')
    expect(tags).toContain('旅行')
  })

  it('should remove duplicate tags', () => {
    const content = '#vue #vue #vue'
    const tags = extractTags(content)
    expect(tags).toEqual(['vue'])
  })

  it('should extract location tags', () => {
    const content = '我在北京，讨论了产品规划。'
    const tags = extractTags(content)
    expect(tags).toContain('北京')
  })

  it('should extract time tags', () => {
    const content = '今天的事情很多，明天再说'
    const tags = extractTags(content)
    expect(tags).toContain('今天')
  })

  it('should limit tags to 6', () => {
    const content = '#a #b #c #d #e #f #g #h'
    const tags = extractTags(content)
    expect(tags.length).toBe(6)
  })

  it('should return empty array for content without tags', () => {
    const content = '普通的内容没有任何标签'
    const tags = extractTags(content)
    expect(tags).toEqual([])
  })
})
