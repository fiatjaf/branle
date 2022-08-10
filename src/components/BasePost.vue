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
        <BaseMarkdown v-else> {{ cleanEvent }} </BaseMarkdown>
        <div
          v-if='!isEmbeded && (isQuote || isRepost)'
          class='reposts flex column q-my-sm q-pa-sm'
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
      <div
        v-if='!isRepost && $store.state.keys.pub && (replyDepth !== -1)'
        class='flex row items-center no-wrap reply-buttons'
        :color="replying ? 'primary' : ''"
        :class='replying ? "justify-between" : "justify-end"'
      >
        <div class='text-primary text-thin col q-pl-xs' style=' font-size: 90%; font-weight: 300;'>{{replyMode}}</div>
          <!-- @reply="replying = !replying" -->
        <div class='flex row no-wrap'>
          <q-tabs
            v-model='replyMode'
            class='no-padding no-margin'
            unelevated
            dense
            flat
            active-color='primary'
            :size='highlighted ? "md" : "sm"'
            @click.stop
          >
            <q-tab name='embed' class='no-padding'>
              <q-icon name='link' >
                <q-tooltip>
                  embed
                </q-tooltip>
              </q-icon>
            </q-tab>
            <q-tab name='repost' class='no-padding'>
              <q-icon name='repeat' >
                <q-tooltip>
                  repost
                </q-tooltip>
              </q-icon>
            </q-tab>
            <q-tab name='quote' class='no-padding'>
              <q-icon name='format_quote' >
                <q-tooltip>
                  quote
                </q-tooltip>
              </q-icon>
            </q-tab>
            <q-tab name='reply' class='no-padding'>
              <q-icon name='chat_bubble_outline' class='flip-horizontal' >
                <q-tooltip>
                  reply
                </q-tooltip>
              </q-icon>
            </q-tab>
          </q-tabs>
          <div class='flex row no-wrap items-center'>
            <q-separator v-if='replyMode' color='primary' size='1px' vertical spaced :class='highlighted ? "q-mt-sm" : "q-mt-xs"'/>
            <q-btn
              v-if='replyMode'
              icon="close"
              color='primary'
              flat
              dense
              @click.stop='replyMode = null'
              :size='highlighted ? "md" : "sm"'
            >
              <q-tooltip>
                cancel
              </q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
      <!-- <q-separator v-if='replyMode' color='primary' size='1px' /> -->
          <!-- <Reply v-if="event" :event="event"/> -->
      </q-item-section>
      <q-item-section v-if="replyMode" class='full-width new-reply-box' ref='replyContent'>
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
          <q-tab-panel name="reply" class='q-pa-sm'>
            <BasePostEntry
              :event="event"
              :reply-mode='replyMode'
              @sent="replySent"
              @resized='calcConnectorValues(10)'
            />
          </q-tab-panel>
        </q-tab-panels>
      </q-item-section>
      <!-- <q-separator v-if='replyMode' color='primary' size='1px' class='q-mt-sm'/> -->

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
import {cleanEvent} from '../utils/event'
import {dbGetEvent} from '../db'
import helpersMixin from '../utils/mixin'
// import BaseButtonPost from 'components/BaseButtonPost.vue'
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
    // BaseButtonPost,
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
      resizing: false,
      trigger: 1,
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
    },

    cleanEvent() {
      return JSON.stringify(cleanEvent(this.event), null, '\n\t')
    },
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
    this.trigger++
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
      } else {
        this.replyMode = ''
        this.replying = false
      }
      this.calcConnectorValues(10)
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
    },

    niceDate(timestamp) {
      if (this.trigger) return this.niceDateUTC(timestamp)
      return this.niceDateUTC(timestamp)
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
  <!-- background: rgba(255, 255, 255, 0.1); -->
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

.new-reply-box {
  border: 1px dashed $primary;
  border-radius: .4rem;
  padding: .3rem .3rem 0;
  margin: 0 0 .3rem;
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

