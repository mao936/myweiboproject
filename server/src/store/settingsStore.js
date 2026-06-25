let settings = { theme: 'cyan', bgInterval: 10 }

export function resetSettings() {
  settings = { theme: 'cyan', bgInterval: 10 }
}

export function getSettings() {
  return { ...settings }
}

export function updateSettings(updates) {
  if (updates.theme !== undefined) {
    settings.theme = String(updates.theme)
  }
  if (updates.bgInterval !== undefined) {
    const interval = Number(updates.bgInterval)
    if (Number.isFinite(interval)) {
      settings.bgInterval = interval
    }
  }
  return getSettings()
}
