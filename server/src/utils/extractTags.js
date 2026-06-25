export function extractTags(content) {
  const tags = []

  const hashTags = content.match(/#([^#\s，。、；！？]{1,12})/g)
  if (hashTags) {
    hashTags.forEach(tag => {
      const clean = tag.replace('#', '').trim()
      if (clean && !tags.includes(clean)) tags.push(clean)
    })
  }

  const locationMatch = content.match(/在([\u4e00-\u9fa5]{2,4})(?:[，。、；！？\s]|$)/)
  if (locationMatch && !tags.includes(locationMatch[1])) {
    tags.push(locationMatch[1])
  }

  const dateMatch = content.match(/(今天|明天|昨天|本周|本月|今年|下周|下个月)/)
  if (dateMatch && !tags.includes(dateMatch[1])) {
    tags.push(dateMatch[1])
  }

  return tags.slice(0, 6)
}
