import {dbGetRelayForPubKey} from '../db'

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

export async function processMentions(event) {
  const mentionRegex = /\B@(?<p>[a-f0-9]{64})\b/g
  let matches = event.content.matchAll(mentionRegex)

  var profileTagIndexMap = {}
  for (let i = 0; i < matches.length; i++) {
    let pubkey = matches[i].groups.p
    let idx = event.tags.findIndex(([t, v]) => t === 'p' && v === pubkey)
    if (idx) {
      profileTagIndexMap[pubkey] = idx
    } else {
      event.tags.push(await getPubKeyTagWithRelay('p', pubkey))
      profileTagIndexMap[pubkey] = event.tags.length - 1
    }
  }

  event.content = event.content.replace(
    mentionRegex,
    (_, pubkey) => `#[${profileTagIndexMap[pubkey]}]`
  )

  return event
}

export async function getPubKeyTagWithRelay(pubkey) {
  var base = ['p', pubkey]
  let relay = await dbGetRelayForPubKey(pubkey)
  if (relay) {
    base.push(relay)
  }
  return base
}

export function getEventTagWithRelay(event) {
  if (event.seen_on && event.seen_on.length) {
    let random = event.seen_on[Math.floor(Math.random() * event.seen_on.length)]
    return ['e', event.id, random]
  }

  return ['e', event.id]
}
