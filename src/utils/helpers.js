import {dbUserProfile, dbEvent} from '../query'

export function shorten(str) {
  return str ? str.slice(0, 5) + '…' + str.slice(-5) : ''
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
  // const mentionRegex = /\B@(?<p>[a-f0-9]{64})\b/g
  // const mentionRegex = /@((?<t>[a-z]{1}):{1})?(?<p>[a-f0-9]{64})\b/g
  // const mentionRegex = /(?<t>[@&]{1})(?<p>[a-f0-9]{64})\b/g

  // let tagIndexMap = {}
  // // event.tags.filter(([t, v]) => (t === 'p' || t === 'e') && v).forEach(([t, v], index) => tagIndexMap[v] = index)
  // for (let match of event.content.matchAll(mentionRegex)) {
  //   let type = null
  //   if (match.groups.t === '&') type = 'e'
  //   let pubkey = match.groups.p
  //   let idx = event.tags.findIndex(([t, v]) => t === (type || 'p') && v === pubkey)
  //   if (idx !== -1) {
  //     tagIndexMap[pubkey] = idx
  //   } else {
  //     if (type === 'e') event.tags.push(['e', pubkey])
  //     event.tags.push(await getPubKeyTagWithRelay(pubkey))
  //     tagIndexMap[pubkey] = event.tags.length - 1
  //   }
  // }

  // event.content = event.content.replace(
  //   mentionRegex,
  //   (_, __, pubkey) => `#[${tagIndexMap[pubkey]}]`
  // )

  // return event
  // event.content = extractMentions(event.content, event.tags)
  console.log('event', event)
  return event
}

// export async function extractMentions(text, tags) {
//   // const mentionRegex = /\B@(?<p>[a-f0-9]{64})\b/g
//   // const mentionRegex = /@((?<t>[a-z]{1}):{1})?(?<p>[a-f0-9]{64})\b/g
//   const mentionRegex = /(?<t>[@&]{1})(?<p>[a-f0-9]{64})\b/g

//   let tagIndexMap = {}
//   // event.tags.filter(([t, v]) => (t === 'p' || t === 'e') && v).forEach(([t, v], index) => tagIndexMap[v] = index)
//   for (let match of text.matchAll(mentionRegex)) {
//     let type = null
//     if (match.groups.t === '&') type = 'e'
//     else if (match.groups.t === '@') type = 'p'
//     else return
//     let pubkey = match.groups.p
//     let idx = tags.findIndex(([t, v]) => t === type && v === pubkey)
//     if (idx !== -1) {
//       tagIndexMap[pubkey] = idx
//     } else {
//       if (type === 'e') tags.push(['e', pubkey])
//       else tags.push(await getPubKeyTagWithRelay(pubkey))
//       tagIndexMap[pubkey] = tags.length - 1
//     }
//   }

//   text = text.replace(
//     mentionRegex,
//     (_, __, pubkey) => `#[${tagIndexMap[pubkey]}]`
//   )

//   return text
// }

export async function getPubKeyTagWithRelay(pubkey) {
  var base = ['p', pubkey]
  let event = await dbUserProfile(pubkey)
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
export async function getEventIdTagWithRelay(eventId) {
  let event = await dbEvent(eventId)
  if (event && event.seen_on && event.seen_on.length) return getEventTagWithRelay(event)

  return ['e', eventId]
}
