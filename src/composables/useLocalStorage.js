import { customRef } from 'vue'

export function useLocalStorage(key, defaultValue) {
  const stored = localStorage.getItem(key)
  let value = stored ? JSON.parse(stored) : defaultValue

  return customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      value = newValue
      if (newValue === null) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(newValue))
      }
      trigger()
    }
  }))
}
