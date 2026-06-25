import { vi } from 'vitest'

export const get = vi.fn()
export const patch = vi.fn()
export const post = vi.fn()
export const del = vi.fn()
export const postFile = vi.fn()

export function resetClientMocks() {
  get.mockReset()
  patch.mockReset()
  post.mockReset()
  del.mockReset()
  postFile.mockReset()
}
