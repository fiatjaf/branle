import {dbGetProfile} from '../db'

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

  var profileTagIndexMap = {}
  for (let match of event.content.matchAll(mentionRegex)) {
    let pubkey = match.groups.p
    let idx = event.tags.findIndex(([t, v]) => t === 'p' && v === pubkey)
    if (idx !== -1) {
      profileTagIndexMap[pubkey] = idx
    } else {
      event.tags.push(await getPubKeyTagWithRelay(pubkey))
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
  let event = await dbGetProfile(pubkey)
  if (event && event.seen_on && event.seen_on.length) {
    let random = event.seen_on[Math.floor(Math.random() * event.seen_on.length)]
    base.push(random)
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
