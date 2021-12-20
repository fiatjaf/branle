import LeftMenu from '../components/LeftMenu.vue'
import Publish from '../components/Publish.vue'
import Balloon from '../components/Balloon.vue'
import Reply from '../components/Reply.vue'
import Post from '../components/Post.vue'

export default ({app}) => {
  app.component('LeftMenu', LeftMenu)
  app.component('Publish', Publish)
  app.component('Balloon', Balloon)
  app.component('Reply', Reply)
  app.component('Post', Post)
}
