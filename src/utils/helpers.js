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
