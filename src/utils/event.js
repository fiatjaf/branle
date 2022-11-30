export function cleanEvent(event) {
  return {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags,
    content: event.content,
    sig: event.sig,
  }
}

export function metadataFromEvent(event) {
  try {
    let metadata = JSON.parse(event.content)
    metadata.pubkey = event.pubkey
    return metadata
  } catch (_) {
    console.log('metadataFromEvent error', _)
    return {}
  }
}

export function isValidEvent(event) {
  if (event.tags.filter(([t, v]) => t === 'e' && (!v || v.includes(' '))).length) return false
  try {
    JSON.parse(event.content)
    return false
  } catch (error) { /* nothing to do */ }
  return true
}
