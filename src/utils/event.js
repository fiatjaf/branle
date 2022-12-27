import * as DOMPurify from 'dompurify'
// import { Dialog } from 'quasar'
import {getEventHash, signEvent} from 'nostr-tools/event'

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
    for (let key of Object.keys(metadata)) metadata[key] = DOMPurify.sanitize(metadata[key])
    metadata.pubkey = event.pubkey
    return metadata
  } catch (_) {
    console.log('metadataFromEvent error', _)
    return {}
  }
}

export function isValidEvent(event) {
  if (event.tags.filter(([t, v]) => t === 'e' && (!v || v.includes(' '))).length) return false
  if (event.content === 'this workshop is awesome!') return false
  if (event.content.trim() === '') return false
  try {
    JSON.parse(event.content)
    return false
  } catch (error) { /* nothing to do */ }
  return true
}

export async function signAsynchronously(event, store) {
  event.id = getEventHash(event)
  if (store.state.keys.priv) {
    event.sig = await signEvent(event, store.state.keys.priv)
  } else if (window.nostr) {
    let signatureOrEvent = await window.nostr.signEvent(event)
    switch (typeof signatureOrEvent) {
      case 'string':
        event.sig = signatureOrEvent
        break
      case 'object':
        event.sig = signatureOrEvent.sig
        break
      default:
        throw new Error('Failed to sign with Nostr extension.')
    }
  }
  return event
  // } else {
  //   return new Promise((resolve, reject) => {
  //     Dialog.create({
  //       class: 'px-6 py-1 overflow-hidden',
  //       title: 'Sign this event manually',
  //       message: `<pre class="font-mono">${JSON.stringify(
  //         event,
  //         null,
  //         2
  //       )}</pre>`,
  //       html: true,
  //       prompt: {
  //         model: '',
  //         type: 'text',
  //         isValid: val => !!val.toLowerCase().match(/^[a-z0-9]{128}$/),
  //         attrs: {autocomplete: 'off'},
  //         label: 'Paste the signature here (as hex)'
  //       }
  //     })
  //       .onOk(resolve)
  //       .onCancel(() => reject('Canceled.'))
  //       .onDismiss(() => reject('Canceled.'))
  //   })
  // }
}
