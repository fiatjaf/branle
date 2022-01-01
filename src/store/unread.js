import {
  onNewMention,
  onNewAnyMessage,
  dbGetChats,
  dbGetUnreadMessages,
  dbGetUnreadNotificationsCount
} from '../db'

export default function (store) {
  const setUnreadNotifications = async () => {
    store.commit(
      'setUnreadNotifications',
      await dbGetUnreadNotificationsCount(
        store.state.keys.pub,
        store.state.lastNotificationRead
      )
    )
  }

  const setUnreadMessages = async peer => {
    store.commit('setUnreadMessages', {
      peer,
      count: await dbGetUnreadMessages(
        peer,
        store.state.lastMessageRead[peer] || 0
      )
    })
  }

  onNewMention(store.state.keys.pub, setUnreadNotifications)
  onNewAnyMessage(event => {
    if (event.pubkey === store.state.keys.pub) return
    setUnreadMessages(event.pubkey)
  })

  setUnreadNotifications()
  dbGetChats().then(chats => {
    chats.forEach(chat => {
      setUnreadMessages(chat.peer)
    })
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
