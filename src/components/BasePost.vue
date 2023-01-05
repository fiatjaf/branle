<template>
  <div
    color='accent'
    class='post-padding cursor-pointer no-hover flex row no-wrap'
    clickable
    manual-focus
    :class='(hasReply ? "post-has-reply" : "") +
      (isReply ? " post-is-reply" : "") +
      (highlighted ? " post-highlighted" : "") +
      (isChildReply ? " post-is-child-reply" : "") +
      (hasReplyChildren ? " post-has-child-reply" : "")'
    @click.stop="toEvent(event.id)"
  >
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
          style='z-index: 1;'
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
    <div class='flex column no-wrap col full-width'>
      <q-item-section ref='postContent' class='relative-position' style='padding: 0 .2rem;'>

        <div class='absolute-top-right flex row items-center post-info' style='z-index: 1;' @click.stop>
          <q-item-label class='q-pr-xs' style='opacity: .8; font-size: 90%;'>{{ niceDate(event.created_at) }}</q-item-label>
          <BaseButtonRelays
            button-class='text-secondary'
            :event='event'
          />
          <BaseButtonInfo
            button-class='text-secondary'
            :event='event'
          />
        </div>
        <div class='q-pb-xs'>
          <q-item-label caption class="text-secondary" style='opacity: .7;'>
              <span @click.stop="toProfile(event.pubkey)">{{ shorten(hexToBech32(event.pubkey, 'npub')) }}</span>
          </q-item-label>
          <q-space/>
          <q-item-label :line='1' clickable>
            <BaseUserName :pubkey="event.pubkey" :show-verified='true' class='text-bold' :show-following='true'/>
          </q-item-label>
          <q-item-label
            v-if="
              tagged &&
              ($route.name != 'event') &&
              !(isReply || isChildReply)
            "
            class='q-pl-sm'
            style='font-size: .9rem;'
          >
            <span >in reply to&nbsp;</span>
            <a @click.stop="toEvent(tagged)">
              {{ shorten(hexToBech32(tagged, 'note')) }}
            </a>
          </q-item-label>
        </div>
        <BaseMarkdown
          v-if="event.kind === 1"
          :content='event.interpolated.text'
          :long-form='isLongForm'
          @expand='isLongForm = !isLongForm'
          @resized='calcConnectorValues(10)'
        />
        <BaseRelayRecommend v-else-if="event.kind === 2" :url="sanitize(event.content)" />
        <pre v-else> {{ cleanEvent }} </pre>
        <div
          v-if='!isEmbeded && (isQuote || isRepost)'
          class='reposts flex column q-pr-md'
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
      <!-- </q-item-label> -->
        <div
          v-if='!isRepost && $store.state.keys.pub && (replyDepth !== -1)'
          class='flex row items-center no-wrap reply-buttons'
          :color="replying ? 'primary' : ''"
          :class='replying ? "justify-between" : "justify-end"'
        >
          <div v-if='replyMode && replyMode !== "tip"' class='text-primary text-thin col q-pl-xs' style=' font-size: 90%; font-weight: 300;'>{{replyMode}}</div>
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
              <q-tab name='tip' class='no-padding'>
                <BaseButtonLightning
                  v-if='$store.getters.profileLud06(event.pubkey)'
                  :pubkey='event.pubkey'
                  :size='highlighted ? "md" : "sm"'
                />
              </q-tab>
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
              <q-separator v-if='replyMode && replyMode !== "tip"' color='primary' size='1px' vertical spaced :class='highlighted ? "q-mt-sm" : "q-mt-xs"'/>
              <q-btn
                v-if='replyMode && replyMode !== "tip"'
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
        <div v-else style='min-height: 1rem;'/>
      </q-item-section>
      <q-item-section v-if="replyMode && replyMode !== 'tip'" class='new-reply-box' ref='replyContent'>
        <q-tab-panels
          v-model="replyPanel"
          class='no-padding full-width overflow-hidden'
          style='background-color: inherit; max-width: 100%; padding: 0 .25 0 0;'
          @transition='calcConnectorValues(10)'
        >
          <q-tab-panel name="embed" class='no-padding' @click.stop>
            <span class='text-caption'>
              copy the formatted event ID below and paste it in any post to embed this event
            </span>
            <BaseButtonCopy :button-text="hexToBech32(event.id, 'note')" color='primary' flat tooltip-text='copy event ID'/>
            <br>
            <span class='text-primary' style='word-break: break-all;'>
              {{ hexToBech32(event.id, 'note') }}
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

      <div v-if='hasReplyChildren && replyDepth !== -1' class='full-width' >
        <div v-for="thread in event.replies" :key="thread[0].id" ref="childReplyContent">
          <BasePostThread
            :events="thread"
            :reply-depth='replyDepth + 1'
            @resized='calcConnectorValues(10)'
            @add-event='addEvent'
          />
        </div>
      </div>
      <div v-if='isRepost' style='min-height: .5rem;'></div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import {nextTick} from 'vue'
import {cleanEvent} from '../utils/event'
import helpersMixin from '../utils/mixin'
import BaseButtonRelays from 'components/BaseButtonRelays.vue'
import BaseButtonInfo from 'components/BaseButtonInfo.vue'
import BaseButtonCopy from 'components/BaseButtonCopy.vue'
import BaseMarkdown from 'components/BaseMarkdown.vue'
import BaseRelayRecommend from 'components/BaseRelayRecommend.vue'
import BaseButtonLightning from 'components/BaseButtonLightning.vue'
import * as DOMPurify from 'dompurify'

export default defineComponent({
  name: 'BasePost',
  emits: ['resized', 'add-event', 'mounted'],
  mixins: [helpersMixin],
  props: {
    event: {type: Object, required: true},
    highlighted: {type: Boolean, default: false},
    position: {type: String, default: 'standalone'},
    replyDepth: {type: Number, default: 0},
    isEmbeded: {type: Boolean, default: false},
  },
  components: {
    BaseButtonRelays,
    BaseButtonInfo,
    BaseButtonCopy,
    BaseMarkdown,
    BaseRelayRecommend,
    BaseButtonLightning,
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
      isLongForm: false,
    }
  },

  computed: {
    tagged() {
      let replyTags = this.event.interpolated?.replyEvents
      if (replyTags?.length) return replyTags[replyTags.length - 1]
      return null
    },

    isRepost() {
      return this.event.interpolated?.text === '' &&
        this.event.interpolated.mentionEvents.length
    },

    isQuote() {
      return this.event.interpolated?.text &&
        this.event.interpolated.mentionEvents.length
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
      return this.sanitize(JSON.stringify(cleanEvent(this.event), null, 2))
    },
  },

  mounted() {
    if (!this.isEmbeded && (this.isQuote || this.isRepost)) {
      if (!Array.isArray(this.reposts)) this.reposts = []
      this.processTaggedEvents(this.mentionEvents, this.reposts)
    }
    this.calcConnectorValues()
    this.$emit('mounted')
    this.isLongForm = this.event.content.length > 600
  },

  activated() {
    this.calcConnectorValues()
    this.trigger++
  },

  deactivated() {
    if (this.reposts.length) {
      for (let event of this.reposts) this.$store.dispatch('cancelUseProfile', {pubkey: event.pubkey})
    }
  },

  methods: {
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

    niceDate(timestamp) {
      if (this.trigger) return this.niceDateUTC(timestamp)
      return this.niceDateUTC(timestamp)
    },

    addEvent(event) {
      console.log('post reply threads add-event', event)
      this.$emit('add-event', event)
    },

    sanitize(text) {
      return DOMPurify.sanitize(text)
    }
  }
})
</script>
<style lang="css" scoped>
.post-padding {
  box-sizing: border-box;
  border-bottom: 1px dotted var(--q-accent);
  padding: .5rem 0 0 .25rem;
  margin-top: 0;
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  overflow: hidden;
  font-size: .9rem;
}
.post-highlighted {
  width: '100%';
  font-size: 1.2rem;
  border: 0;
}
.post-highlighted .reposts {
  font-size: .9rem;
  max-width: 100%;
}
.reposts {
  margin: .5rem .5rem 0 0;
}
.reposts .post-padding {
  border: 0;
}
.post-is-reply,
.post-has-reply,
.post-is-child-reply,
.post-has-child-reply {
}
.post-is-child-reply,
.post-has-reply {
  border-bottom: 0;
}
.post-is-child-reply {
  padding: 0;
}
.has-reply-connector,
.is-reply-connector,
.has-child-reply-connector,
.has-child-reply-tick {
  opacity: .7;
}
.has-reply-connector {
  width: 2px;
  position: absolute;
  left: calc((100% / 2) - 1px);
  height: 100%;
  top: 1.5rem;
  background: var(--q-accent);
  z-index: 0;
}
.is-reply-connector {
  width: 2px;
  position: absolute;
  left: calc((100% / 2) - 1px);
  height: 2rem;
  top: -1.5rem;
  background: var(--q-accent);
  z-index: 0;
}
.has-replying-connector {
  width: .7rem;
  position: absolute;
  left: calc((100% / 2) - 1px);
  top: 1.5rem;
  border-left: 2px solid var(--q-accent);
  border-bottom: 2px solid var(--q-accent);
  z-index: 0;
  opacity: .3;
}
.post-highlighted .has-replying-connector {
  top: 1.9rem;
}
.has-child-reply-connector {
  width: 2px;
  position: absolute;
  left: calc((100% / 2) - 1px);
  top: .6rem;
  background: var(--q-accent);
  z-index: 0;
}
.has-child-reply-tick {
  width: .55rem;
  height: 2px;
  position: absolute;
  left: calc((100% / 2) - 1px);
  background: var(--q-accent);
  z-index: 0;
}

.new-reply-box {
  border: 1px solid var(--q-primary);
  border-radius: .4rem;
  padding: .3rem .3rem 0;
  margin: 0 .3rem .3rem 0;
}

@media screen and (min-width: 600px) {
}
</style>

<style lang="css">
.reposts {
  border-radius: .75rem;
  box-shadow: 0 0 .3rem -.0rem var(--q-accent);
  min-width: 150px;
}
</style>

