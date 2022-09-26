const worker = new Worker(new URL('./relay.worker.js', import.meta.url))

const hub = {}

worker.onmessage = ev => {
  let { id, success, error, data } = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data

  if (!success) {
    hub[id].reject(new Error(id + ':' + error))
    delete hub[id]
    return
  }

  // if (data) console.debug('🖴', id, '->', data)
  hub[id]?.resolve?.(data)
  delete hub[id]
}

function call(name, args) {
  let id = name + ' ' + Math.random().toString().slice(-4)
  // console.debug('🖴', id, '<-', args)
  worker.postMessage(JSON.stringify({ id, name, args }))
  return new Promise((resolve, reject) => {
    hub[id] = { resolve, reject }
  })
}

// function stream(name, args, callback) {
//   let id = name + ' ' + Math.random().toString().slice(-4)
//   hub[id] = callback
//   console.debug('db <-', id, args)
//   worker.postMessage(JSON.stringify({ id, name, args, stream: true }))
//   return {
//     cancel() {
//       worker.postMessage(JSON.stringify({ id, cancel: true }))
//     }
//   }
// }

function sub(name, args) {
  let id = name + ' ' + Math.random().toString().slice(-4)
  // hub[id] = callback
  console.debug('sub', id, args)
  worker.postMessage(JSON.stringify({ id, name, args, sub: true }))
  return {
    update(...args) {
      worker.postMessage(JSON.stringify({ id, name, args, sub: true }))
    },
    cancel() {
      worker.postMessage(JSON.stringify({ id, sub: true, cancel: true }))
      delete hub[id]
    }
  }
}

export function subUser(pubkey) {
  return sub('subUser', [pubkey])
}

export function subUserNotes(pubkey) {
  return sub('subUserNotes', [pubkey])
}

export function subUserProfile(pubkey) {
  return sub('subUserProfile', [pubkey])
}

export function subUserFollows(pubkey) {
  return sub('subUserFollows', [pubkey])
}

export function subUserFollowers(pubkey) {
  return sub('subUserFollowers', [pubkey])
}

export function subUserMessages(pubkey) {
  return sub('subUserMessages', [pubkey])
}

export function subTag(type, value) {
  return sub('subTag', [type, value])
}

export function subFeed(since) {
  return sub('subFeed', [since])
}

export function subEvent(id) {
  return sub('subEvent', [id])
}

export function activateSub() {
  return call('activateSub', [])
}

export function deactivateSub() {
  return call('deactivateSub', [])
}

export function close() {
  return call('close', [])
}

export function setRelays(relays) {
  return call('setRelays', [relays])
}

export function setPort(channel) {
  worker.postMessage({ name: 'setPort' }, [ channel.port2 ])
}

export function publish(event, relayURL) {
  return call('publish', [event, relayURL])
}


// // this will try to sign either with window.nostr or using a manual prompt
// export async function signAsynchronously(event) {
//   if (window.nostr) {
//     let signatureOrEvent = await window.nostr.signEvent(event)
//     switch (typeof signatureOrEvent) {
//       case 'string':
//         return signatureOrEvent
//       case 'object':
//         return signatureOrEvent.sig
//       default:
//         throw new Error('Failed to sign with Nostr extension.')
//     }
//   } else {
//     return new Promise((resolve, reject) => {
//       Dialog.create({
//         class: 'px-6 py-1 overflow-hidden',
//         title: 'Sign this event manually',
//         message: `<pre class="font-mono">${JSON.stringify(
//           event,
//           null,
//           2
//         )}</pre>`,
//         html: true,
//         prompt: {
//           model: '',
//           type: 'text',
//           isValid: val => !!val.toLowerCase().match(/^[a-z0-9]{128}$/),
//           attrs: {autocomplete: 'off'},
//           label: 'Paste the signature here (as hex)'
//         }
//       })
//         .onOk(resolve)
//         .onCancel(() => reject('Canceled.'))
//         .onDismiss(() => reject('Canceled.'))
//     })
//   }
// }
