    <!-- :clickable='$route.params.eventId !== event.id && !replying' -->
<template>
  <q-item
    color='accent'
    class='post-padding cursor-pointer no-hover'
    clickable
    manual-focus
    :class='(hasReply ? "post-has-reply" : "") +
      (isReply ? " post-is-reply" : "") +
      (highlighted ? " post-highlighted" : "") +
      (isChildReply ? " post-is-child-reply" : "") +
      (hasReplyChildren ? " post-has-child-reply" : "")'
    @click.stop="toEvent(event.id)"
  >
  <div class='absolute-top-right flex row items-center post-info' @click.stop>
    <q-item-label caption style='opacity: .8;'>{{ niceDate(event.created_at) }}</q-item-label>
    <BaseButtonRelays
      button-class='text-secondary'
      :event='event'
    />
    <BaseButtonInfo
      button-class='text-secondary'
      :event='event'
    />
  </div>
  <div
    clickable
    avatar
    top
    class='relative-position'
  >
    <div v-if="isReply" class="is-reply-connector"></div>
    <!-- <q-avatar :size='replyDepth ? "sm" : ""' style='z-index: 1;' @click.stop="toProfile(event.pubkey)">
      <img :src="$store.getters.avatar(event.pubkey)" />
    </q-avatar> -->
      <BaseUserAvatar
        :pubkey='event.pubkey'
        size='1.5rem'
        :round='true'
        :bordered='hasReply || isReply || hasReplyChildren || isChildReply'
        :hover-effect='true'
      />
    <div v-if="hasReply" class="has-reply-connector"></div>
    <div
      v-if="replyMode === 'reply'"
      class="has-replying-connector"
      :style='"height: " + (postHeight) + "px;"'
    />
    <div
      ref='hasChildReplyConnector'
      v-if="hasReplyChildren"
      class="has-child-reply-connector"
      style='visibility: hidden;'
      :style='childReplyConnectorStyle()'
    >
      <div
        v-for="(thread, index) in event.replies"
        :key="thread[0].id"
        ref="hasChildReplyConnectorTick"
        class="has-child-reply-tick"
        :style='childReplyTickStyle(index)'
      />
    </div>
  </div>
      <!-- :style='"height: " + (childReplyContentHeight) + "px;"' -->
    <q-item-section>
    <q-item-section ref='postContent'>
      <q-item-label caption class="text-secondary" style='opacity: .7;'>
          <span @click.stop="toProfile(event.pubkey)">{{ shorten(event.pubkey) }}</span>
      </q-item-label>
      <q-space/>
      <q-item-label :line='1' clickable>
        <BaseUserName :pubkey="event.pubkey" :show-verified='true' class='text-bold'/>
      </q-item-label>
      <q-item-label
        v-if="
          tagged &&
          ($route.name === 'feed' || $route.name === 'profile' || $route.name === 'notifications') &&
          !(isReply || isChildReply)
        "
        caption
        class='q-pl-sm'
      >
        <span>in reply to&nbsp;</span>
        <a
          @click.stop="toEvent(tagged)"
        >
          {{ shorten(tagged) }}
        </a>
      </q-item-label>

      <q-item-label
        class='q-pt-xs break-word-wrap'
        style='overflow: auto;'
      >
        <BaseMarkdown v-if="event.kind === 1">
          {{ event.interpolated.text }}
        </BaseMarkdown>
        <BaseRelayRecommend v-else-if="event.kind === 2" :url="event.content" />
        <div
          v-if='!isEmbeded && (isQuote || isRepost)'
          class='reposts flex column q-my-sm q-mr-sm q-pa-sm'
          :clickable='false'
        >
          <BasePost
            v-for='(repost, index) in reposts'
            :key='repost.id + "_" + reposts.length + "_" + index'
            :event='repost'
            :manual-focus='false'
            :is-embeded='true'
            @click.stop="toEvent(repost.id)"
            @resized='calcConnectorValues(10)'
          />
        </div>
      </q-item-label>
      <!-- <q-separator v-if='replying' color='primary' size='1px' spaced/> -->
      <div
        v-if='!isRepost'
        class='flex row items-center no-wrap'
        :color="replying ? 'primary' : ''"
        :class='replying ? "justify-between" : "justify-end"'
      >
        <div class='text-primary text-thin col q-pl-xs' style='letter-spacing: .05rem;'>{{replyMode}}</div>
          <!-- @reply="replying = !replying" -->
        <div>
        <q-btn-toggle
          v-model='replyMode'
          v-if='!isRepost && replyMode'
          class='no-padding no-margin'
          unelevated
          :dense='postContentWidth < 350'
          flat
          toggle-color='primary'
          :size='highlighted ? "md" : "sm"'
          @click.stop
          :options="[
            {value: 'embed', slot: 'embed'},
            {value: 'repost', slot: 'repost'},
            {value: 'quote', slot: 'quote'},
            {value: 'reply', slot: 'reply'},
            ]"
        >
          <template #embed>
            <q-icon name='link' >
              <q-tooltip>
                embed
              </q-tooltip>
            </q-icon>
          </template>
          <template #repost>
            <q-icon name='repeat' >
              <q-tooltip>
                repost
              </q-tooltip>
            </q-icon>
          </template>
          <template #quote>
            <q-icon name='format_quote' >
              <q-tooltip>
                quote
              </q-tooltip>
            </q-icon>
          </template>
          <template #reply>
            <q-icon name='chat_bubble_outline' class='flip-horizontal' >
              <q-tooltip>
                reply
              </q-tooltip>
            </q-icon>
          </template>
          <!-- <q-tab v-if='replying' name="embed" icon='link' />
          <q-tab v-if='replying' name="repost" icon='repeat' />
          <q-tab v-if='replying' name="quote" icon='format_quote'/>
          <q-tab name="reply" @click.stop='toggleReplying'>
          </q-tab> -->
          <!-- <template #reply>
          </template> -->
        </q-btn-toggle>
            <BaseButtonPost
              :is-open='replying'
              :button-size='highlighted ? "sm" : "xs"'
              @click.stop='toggleReplying'
            />
        </div>
      </div>
          <!-- <Reply v-if="event" :event="event"/> -->
      </q-item-section>
      <q-item-section v-if="replying" class='no-padding no-margin full-width' ref='replyContent'>
      <q-tab-panels
        v-model="replyPanel"
        class='no-padding full-width overflow-hidden'
        style='background-color: inherit;'
        @transition='calcConnectorValues(10)'
      >
      <q-tab-panel name="embed" class='no-padding full-width overflow-auto' @click.stop>
        <span class='text-caption full-width'>
          copy the formatted event ID below and paste it in any post to embed this event
        </span>
          <BaseButtonCopy :button-text="'&' + event.id" color='primary' flat tooltip-text='copy event ID'/>
        <span class='text-primary full-width'>
          {{ '&' + event.id }}
        </span>
      </q-tab-panel>
      <q-tab-panel name="reply" class='no-padding'>
        <BasePostEntry
          :event="event"
          :reply-mode='replyMode'
          @sent="replySent"
          @resized='calcConnectorValues(10)'
        />
      </q-tab-panel>
      </q-tab-panels>
      </q-item-section>

      <q-item v-if='hasReplyChildren' class='no-padding no-border no-margin column full-width' >
      <div v-for="thread in event.replies" :key="thread[0].id" ref="childReplyContent">
        <BasePostThread
          :events="thread"
          :reply-depth='replyDepth + 1'
          @resized='calcConnectorValues(10)'
        />
      </div>
      </q-item>
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent } from 'vue'
// import VueForceNextTick from 'vue-force-next-tick'
import {nextTick} from 'vue'
import {pool} from '../pool'
import {dbGetEvent} from '../db'
import helpersMixin from '../utils/mixin'
import BaseButtonPost from 'components/BaseButtonPost.vue'
import BaseButtonRelays from 'components/BaseButtonRelays.vue'
import BaseButtonInfo from 'components/BaseButtonInfo.vue'
import BaseButtonCopy from 'components/BaseButtonCopy.vue'
import BaseMarkdown from 'components/BaseMarkdown.vue'
import BaseRelayRecommend from 'components/BaseRelayRecommend.vue'

export default defineComponent({
  name: 'BasePost',
  emits: ['resized', 'add-event'],
  mixins: [helpersMixin],
  props: {
    event: {type: Object, required: true},
    highlighted: {type: Boolean, default: false},
    position: {type: String, default: 'standalone'},
    replyDepth: {type: Number, default: 0},
    isEmbeded: {type: Boolean, default: false},
  },
  components: {
    BaseButtonPost,
    BaseButtonRelays,
    BaseButtonInfo,
    BaseButtonCopy,
    BaseMarkdown,
    BaseRelayRecommend,
  },

  data() {
    return {
      clicking: false,
      replying: false,
      childReplyHeights: [],
      postHeight: 0,
      replyHeight: 0,
      reposts: [],
      eventSub: null,
      replyMode: '',
      // replyPanel: '',
      resizing: false,
      // rerenderKey: 0,
    }
  },

  computed: {
    tagged() {
      // let eventTags = this.event.tags.filter(([t, v]) => t === 'e').map(([t, v]) => v)
      // let lastEventTag = eventTags[eventTags.length - 1]
      // // console.log('BasePost eventTags: ', eventTags, 'return: ', lastEventTag)
      // if (lastEventTag) return lastEventTag
      // for (let i = this.event.tags.length - 1; i >= 0; i--) {
      //   let tag = this.event.tags[i]
      //   if (tag.length === 2 && tag[0] === 'e') {
      //     return tag[1]
      //   }
      // }
      let replyTags = this.event.interpolated.replyEvents
      if (replyTags?.length) return replyTags[replyTags.length - 1]
      return null
    },
    // content() {
    //   return this.interpolateMentions(this.event.content, this.event.tags)
    // },

    isRepost() {
      return this.event.interpolated?.text === '' &&
        this.event.interpolated.mentionEvents.length
      // return this.content.text === '' && this.content.mentions.eventMentions.length
    },

    isQuote() {
      return this.event.interpolated?.text &&
        this.event.interpolated.mentionEvents.length
      // return this.content.text && this.content.mentions.eventMentions.length
    },

    mentionEvents() {
     return this.event.interpolated?.mentionEvents
    },

    isReply() {
      return this.position === 'middle' || this.position === 'last'
    },

    hasReply() {
      return this.position === 'middle' || this.position === 'first'
    },

    isChildReply() {
      if (this.replyDepth) return true
      return false
    },

    hasReplyChildren() {
      if (this.event.replies && this.event.replies.length > 0) return true
      return false
    },

    postContentWidth() {
      if (this.resizing) return this.$refs.postContent?.$el?.clientWidth
      return this.$refs.postContent?.$el?.clientWidth
    },

    postContentHeight() {
      // only including if statement to trigger recalc on resize
      if (this.resizing) return this.$refs.postContent?.$el?.clientHeight
      return this.$refs.postContent?.$el?.clientHeight
    },

    replyContentHeight() {
      // only including if statement to trigger recalc on resize
      if (this.replyMode && this.resizing && this.$refs.replyContent?.$el) return this.$refs.replyContent?.$el?.clientHeight
      else return this.$refs.replyContent?.$el?.clientHeight || 0
    },

    replyPanel() {
      if (this.replyMode === 'embed') return 'embed'
      else if (this.replyMode) return 'reply'
      else return ''
    }
  },

  mounted() {
    // console.log('mounted')
    if (!this.isEmbeded && (this.isQuote || this.isRepost)) {
      this.listenReposts(this.mentionEvents)
      // console.log('eventMentions:', this.mentionEvents)
    }
    this.calcConnectorValues()
  },

  // updated() {
  //   this.calcConnectorValues()
  // },

  activated() {
    this.calcConnectorValues()
  },

  methods: {
    // startClicking() {
    //   if (this.event.kind === 2) return

    //   this.clicking = true
    //   setTimeout(() => {
    //     this.clicking = false
    //   }, 200)
    // },

    // finishClicking(ev) {
    //   if (ev.target.tagName === 'A') return

    // replyingConnectorStyle() {
    //   if (this.replying && ) {
    //     let height = this.postHeight + this.childReplyHeights.slice(0, -1).reduce((c, p) => c + p, 0)
    //     if (this.replyHeight) height += this.replyHeight
    //     return 'visibility: visible; height: ' + height + 'px'
    //   } else return ''
    // },

    childReplyConnectorStyle() {
      if (this.childReplyHeights?.length) {
        let height = this.postHeight + this.childReplyHeights.slice(0, -1).reduce((c, p) => c + p, 0)
        if (this.replyHeight) height += this.replyHeight
        return 'visibility: visible; height: ' + height + 'px'
      } else return ''
    },

    childReplyTickStyle(index) {
      if (this.childReplyHeights?.length) {
        let offset = this.postHeight + this.childReplyHeights.filter((_, i) => i < index).reduce((c, p) => c + p, 0)
        if (this.replyHeight) offset += this.replyHeight
        return 'visibility: visible; top: ' + offset + 'px'
      } else return ''
    },

    calcConnectorValues(time = 2000) {
      this.resizing = !this.resizing
      nextTick(() => {
        setTimeout(() => {
          this.postHeight = this.postContentHeight
          this.replyHeight = this.replyContentHeight
          if (this.hasReplyChildren) {
            this.childReplyHeights = this.$refs.childReplyContent?.map((div) => div.clientHeight)
            // for (let {height, i} of childReplyHeights)
            //   this.set(this.childReplyHeights, i, height)
          }
          this.$emit('resized')
        }, time)
      })
    },

    toggleReplying() {
      if (this.replyMode === '') {
        this.replying = true
        this.replyMode = 'reply'
        // this.replyPanel = 'reply'
      } else {
        this.replyMode = ''
        // this.replyPanel = ''
        this.replying = false
      }
      this.calcConnectorValues(10)
      // this.$emit('resized')
    },

    replySent(event) {
      this.replying = false
      this.replyMode = ''
      this.$emit('add-event', event)
    },

    async listenReposts(eventIds) {
      let subEventIds = []
      // let this.reposts = []
      // only render first 10 reposts
      eventIds.splice(10)
      for (let eventId of eventIds) {
        let event = await dbGetEvent(eventId)
        if (event) {
          this.$store.dispatch('useProfile', {
            pubkey: event.pubkey,
            request: true
          })
          this.interpolateEventMentions(event)
          this.reposts.push(event)
        } else {
          subEventIds.push(eventId)
        }
      }
      // console.log('this.reposts: ', this.reposts)
      // console.log('subEventIds: ', subEventIds)
      this.eventSub = pool.sub(
        {
          filter: {ids: subEventIds},
          cb: async event => {
            this.eventSub.unsub()
            this.$store.dispatch('useProfile', {
              pubkey: event.pubkey,
              request: true
            })
            this.interpolateEventMentions(event)
            this.reposts.push(event)
            // this.event = event
          }
        },
        'event-browser'
      )
    }

      // listen to changes to the event in the db so we get .seen_on updates
      // this.eventUpdates = await onEventUpdate(
      //   this.$route.params.eventId,
      //   event => {
      //     // once we get an update from the db we know we can stop listening for relay updates
      //     if (this.eventSub) this.eventSub.unsub()

      //     // and just update our local event with the latest one from the db
      //     this.event = event
      //   }
      // )
    // },
  }
})
</script>
  <!-- background-color: rgba(255, 255, 255, 0.2); -->
<style lang="scss" scoped>
.post-padding {
  box-sizing: border-box;
  border-bottom: 1px dotted $accent;
  padding: 1rem 0 0;
  margin-top: 0;
  gap: .25rem;
  width: 100%;
  overflow-y: hidden;
  font-size: .9rem;
}
.post-highlighted {
  width: '100%';
  font-size: 1.2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 0;
}
.post-highlighted .reposts {
  font-size: .9rem;
}

.reposts .post-padding {
  border: 0
}
.post-is-reply,
.post-has-reply,
.post-is-child-reply,
.post-has-child-reply {
  gap: .25rem;
}
.post-is-child-reply,
.post-has-reply {
  border-bottom: 0;
}
.has-reply-connector {
  width: 2px;
  position: absolute;
  left: calc((100% / 2) - 1px);
  height: 100%;
  top: 1.5rem;
  background: $accent;
  z-index: 0;
}
.is-reply-connector {
  width: 2px;
  position: absolute;
  left: calc((100% / 2) - 1px);
  height: 2rem;
  top: -1.5rem;
  background: $accent;
  z-index: 0;
}
.has-replying-connector {
  width: .7rem;
  position: absolute;
  left: calc((100% / 2) - 1px);
  top: 1.5rem;
  border-left: 2px dotted $accent;
  border-bottom: 2px dotted $accent;
  z-index: 0;
}
.post-highlighted .has-replying-connector {
  top: 1.9rem;
}
.has-child-reply-connector {
  width: 2px;
  position: absolute;
  left: calc((100% / 2) - 1px);
  top: 1.55rem;
  background: $accent;
  z-index: 0;
}
.has-child-reply-tick {
  width: .7rem;
  height: 2px;
  position: absolute;
  left: calc((100% / 2) - 1px);
  background: $accent;
  z-index: 0;
}

@media screen and (min-width: 600px) {
}
</style>

<style lang="scss">
.reposts {
  border-radius: .25rem;
  border: 1px dotted $accent;
  min-width: 150px;
}
</style>

