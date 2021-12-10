export function setProfile(state, profile) {
  state.myProfile = profile
}

export function relayPush(state, url) {
  state.myProfile.relays.push(url)
}

export function relaySplice(state, url) {
  let index = state.myProfile.relays.indexOf(url)
  if (index === -1) return
  state.myProfile.relays.splice(index, 1)
}

export function startFollowing(state, key) {
  // use metadata from kind0 or leave everything blank
  state.theirProfile = {
    [key]: state.kind0[key] || {name: null, about: null, picture: null},
    ...state.theirProfile
  }
}

export function stopFollowing(state, key) {
  delete state.theirProfile[key]
}

export function addKind1(state, event) {
  state.kind1.unshift(event)
}

export function replaceKind1(state, {index, event}) {
  state.kind1 = [
    ...state.kind1.slice(0, index),
    event,
    ...state.kind1.slice(index + 1)
  ]
}
export function deleteKind1(state, id) {
  console.log(state.kind1)
  console.log(id)
  let index = state.kind1.findIndex(event => event.id === id)
  console.log(index)
  if (index !== -1) state.kind1.splice(index, 1)
}

export function addKind0(state, event) {
  // increment theirProfile with this or store it temporarily
  try {
    let {name, about, picture} = JSON.parse(event.content)

    if (event.pubkey in state.theirProfile) {
      state.theirProfile[event.pubkey] = {name, about, picture}
      return
    }
    state.kind0[event.pubkey] = {name, about, picture}
  } catch (err) {
    return
  }
}

export function chatUpdated(state) {
  state.chatUpdated++
}
