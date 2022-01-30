export function shorten(str) {
  return str ? str.slice(0, 3) + '…' + str.slice(-4) : ''
}

export function getElementFullHeight(element) {
  let styles = window.getComputedStyle(element)
  let margin =
    parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom'])

  return Math.ceil(element.offsetHeight + margin)
}

export function isElementFullyScrolled(element) {
  return (
    element.scrollHeight - Math.abs(element.scrollTop) === element.clientHeight
  )
}

export function cleanEvent(event) {
  return {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags,
    content: event.content,
    sig: event.sig
  }
}

export function metadataFromEvent(event) {
  try {
    let metadata = JSON.parse(event.content)
    metadata.pubkey = event.pubkey
    return metadata
  } catch (_) {
    return {}
  }
}

export function addSorted(list, newItem, compare) {
  for (let i = 0; i < list.length; i++) {
    let item = list[i]
    if (compare(item, newItem)) {
      list.splice(i, 0, newItem)
      return
    }
  }

  // the newer event is the oldest, add to end
  list.push(newItem)
}

export function processMentions(event) {
  const mentionRegex = /\B@(?<p>[a-f0-9]{64})\b/g

  const matches = Array.from(event.content.matchAll(mentionRegex)).map(
    match => match.groups.p
  )

  const tags = Array.from(new Set(matches).values()).reduce(
    (tags, pubkey) =>
      tags.find(([t, v]) => t === 'p' && v === pubkey)
        ? tags
        : [...tags, ['p', pubkey]],
    event.tags
  )

  const indexOfProfileTag = profile =>
    tags.findIndex(tag => tag[0] === 'p' && tag[1] === profile)

  const replacer = (_, profile) => `#[${indexOfProfileTag(profile)}]`

  const content = event.content.replace(mentionRegex, replacer)

  return {
    ...event,
    tags,
    content
  }
}
