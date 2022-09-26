import {
  dbChats,
  dbUnreadMessagesCount,
  dbUnreadMentionsCount,
  streamTag
} from '../query'

export default function (store) {
  const setUnreadNotifications = async () => {
    store.commit(
      'setUnreadNotifications',
      await dbUnreadMentionsCount(
        store.state.keys.pub,
        store.state.lastNotificationRead
      )
    )
  }

  const setUnreadMessages = async peer => {
    store.commit('setUnreadMessages', {
      peer,
      count: await dbUnreadMessagesCount(
        store.state.keys.pub,
        peer,
        store.state.lastMessageRead[peer] || 0
      )
    })
  }

  var sub = null
  const streamMentionsAndMessages = () => {
    if (store.state.keys.pub && !sub) streamTag('p', store.state.keys.pub, event => {
      if (event.kind === 1) setUnreadNotifications
      else if (event.kind === 4) setUnreadMessages(event.pubkey)
    })
    else {
      let interval = setInterval(() => {
        if (store.state.keys.pub && !sub) {
          streamTag('p', store.state.keys.pub, event => {
              if (event.kind === 1) setUnreadNotifications
              else if (event.kind === 4) setUnreadMessages(event.pubkey)
          })
          clearInterval(interval)
        }
      }, 2000)
    }

    setUnreadNotifications()
    dbChats(store.state.keys.pub).then(chats => { chats.forEach(chat => { setUnreadMessages(chat.peer) }) })
  }


  store.subscribeAction(({type, payload}, state) => {
    switch (type) {
      case 'launch':
        streamMentionsAndMessages()
        break
    }
  })

  store.subscribe(({type, payload}, state) => {
    switch (type) {
      case 'haveReadNotifications':
        setUnreadNotifications()
        break
      case 'haveReadMessage':
        setUnreadMessages(payload)
        break
    }
  })
}
