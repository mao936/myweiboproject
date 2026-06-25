import { describe, it, expect } from 'vitest'
import { escapeHtml } from '@/utils/escapeHtml'

describe('escapeHtml', () => {
  it('should escape special characters', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
  })

  it('should escape ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('should escape single quote', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s')
  })
})
