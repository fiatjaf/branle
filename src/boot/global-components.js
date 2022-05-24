import BasePost from '../components/BasePost.vue'
import BaseUserName from '../components/BaseUserName.vue'
import BaseUserAvatar from '../components/BaseUserAvatar.vue'
import BaseUserCard from '../components/BaseUserCard.vue'
import BasePostEntry from '../components/BasePostEntry.vue'
import BasePostThread from '../components/BasePostThread.vue'

export default ({app}) => {
  app.component('BasePost', BasePost)
  app.component('BaseUserName', BaseUserName)
  app.component('BaseUserAvatar', BaseUserAvatar)
  app.component('BaseUserCard', BaseUserCard)
  app.component('BasePostEntry', BasePostEntry)
  app.component('BasePostThread', BasePostThread)
}
