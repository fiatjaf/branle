import RawEventData from '../components/RawEventData.vue'
import Recommend from '../components/Recommend.vue'
import Markdown from '../components/Markdown.vue'
import ShowMore from '../components/ShowMore.vue'
import Publish from '../components/Publish.vue'
import Balloon from '../components/Balloon.vue'
import Thread from '../components/Thread.vue'
import Follow from '../components/Follow.vue'
import Reply from '../components/Reply.vue'
import Post from '../components/Post.vue'
import Name from '../components/Name.vue'

export default ({app}) => {
  app.component('RawEventData', RawEventData)
  app.component('Recommend', Recommend)
  app.component('Markdown', Markdown)
  app.component('ShowMore', ShowMore)
  app.component('Publish', Publish)
  app.component('Balloon', Balloon)
  app.component('Thread', Thread)
  app.component('Follow', Follow)
  app.component('Reply', Reply)
  app.component('Post', Post)
  app.component('Name', Name)
}
