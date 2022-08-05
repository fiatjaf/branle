import {dbGetUnreadNotificationsCount} from '../db'

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

  setUnreadNotifications()

  store.subscribe(({type, payload}, state) => {
    switch (type) {
      case 'haveReadNotifications':
        setUnreadNotifications()
        break
    }
  })
}
