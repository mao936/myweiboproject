import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatTime } from '@/utils/formatTime'

describe('formatTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "刚刚" for less than 60 seconds', () => {
    vi.setSystemTime(new Date('2026-06-25T12:00:30.000Z'))
    expect(formatTime('2026-06-25T12:00:00.000Z')).toBe('刚刚')
  })

  it('should return minutes ago for less than 1 hour', () => {
    vi.setSystemTime(new Date('2026-06-25T12:30:00.000Z'))
    expect(formatTime('2026-06-25T12:00:00.000Z')).toBe('30 分钟前')
  })

  it('should return hours ago for less than 24 hours', () => {
    vi.setSystemTime(new Date('2026-06-25T14:00:00.000Z'))
    expect(formatTime('2026-06-25T12:00:00.000Z')).toBe('2 小时前')
  })

  it('should return formatted date for more than 24 hours', () => {
    vi.setSystemTime(new Date('2026-06-25T12:00:00.000Z'))
    const result = formatTime('2026-06-24T10:30:00.000Z')
    expect(result).toMatch(/\d{2}月\d{2}日 \d{2}:\d{2}/)
  })
})
