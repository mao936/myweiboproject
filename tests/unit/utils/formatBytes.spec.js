import { describe, it, expect } from 'vitest'
import { formatBytes } from '@/utils/formatBytes'

describe('formatBytes', () => {
  it('should format 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('should format bytes', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('should format kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })

  it('should format megabytes', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB')
  })
})
