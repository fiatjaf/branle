import Tribute from 'tributejs'
import {shorten} from './helpers'
// import { stringify } from 'JSON'
import {date} from 'quasar'
const { formatDate } = date
// const { startOfDate, formatDate } = date
// const { buildDate, formatDate } = date
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

export default {
  methods: {
    getLocation() {
      return location
    },

    json(o) {
      return JSON.stringify(o, null, 2)
    },

    log(o) {
      return console.log(o)
    },

    toProfile(pubkey) {
      this.$router.push('/' + pubkey)
    },

    toEvent(id, childThreads = null) {
      if (childThreads) this.$router.push({
        name: 'event',
        params: { eventId: id, childThreads: JSON.stringify(childThreads) },
      })
      else this.$router.push('/event/' + id)
    },

    shorten,

    niceDate(value) {
      // if (value + 60 * 60 /* an hour */ > Date.now() / 1000) {
      //   return relative(value * 1000)
      // }

      // return date.formatDate(value * 1000, 'YYYY MMM D h:mm A')
      let niceDateString = timeAgo.format(value * 1000, 'twitter-now')
      if (niceDateString.includes(' ')) return niceDateString
      else return niceDateString + ' ago'
    },

    dateUTC(value) {
      let date = new Date(value * 1000)
      let dateUtc = new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        // date.getUTCHours(),
        // date.getUTCMinutes(),
        )
      let now = Date.now()
      if (now - dateUtc.getTime() < (1000 * 60 * 60 * 24 * 365)) return formatDate(dateUtc, 'ddd Do MMMM')
      return formatDate(dateUtc, 'ddd Do MMMM YYYY')
    },

    timeUTC(value) {
      let date = new Date(value * 1000)
      return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} UTC`
    },

    interpolateMentions(text, tags) {
      const mentions = {
        profiles: [],
        replyEvents: [],
        mentionEvents: [],
      }
      text = String(text).trim()
      if (text === '') {
        return {
          text: text,
          replyEvents: [],
          mentionEvents: tags.filter(([t, v]) => (t === 'e') && v).map(([_, v]) => v)
        }
      }
      const replacer = (match, index) => {
        if (tags.length - 1 < Number(index) || tags[Number(index)].length < 2 || !['e', 'p'].includes(tags[Number(index)][0])) return match
        if (tags[Number(index)][0] === 'e') {
          const eventId = tags[Number(index)][1]
          mentions.mentionEvents.push(eventId)
          // if repost remove text
          if (match.length === text.length) return ''
          return `[&${shorten(eventId)}](/event/${eventId})`
        } else if (tags[Number(index)][0] === 'p') {
          const profile = tags[Number(index)][1]
          const displayName = this.$store.getters.displayName(profile)
          return `[@${displayName}](/${profile})`
        }
      }
      const hashtagReplacer = (match, hashtag) => {
        return `[${match}](/hashtag/${hashtag})`
      }

      let replacedText = text.replace(/#\[(\d+)\]/g, replacer)
      let hashtagReplacedText = replacedText.replace(/#([\w]{1,63})/g, hashtagReplacer)

      tags.filter(([t, v]) => (t === 'e') && v).forEach(([t, v], index) => {
        if (!mentions.mentionEvents.includes(v)) {
          // if (index < 2) mentions.replyEvents.push(v)
          if (mentions.replyEvents.length < 2) mentions.replyEvents.push(v)
          else mentions.mentionEvents.push(v)
        }
      })

      return {
        text: hashtagReplacedText,
        replyEvents: mentions.replyEvents,
        mentionEvents: mentions.mentionEvents
      }
    },

    interpolateEventMentions(events) {
      if (!Array.isArray(events)) events = [events]
      events.forEach((event) => {
        if (!event.interpolated) event.interpolated = this.interpolateMentions(event.content, event.tags || [])
      })
    },

    interpolateMessageMentions(events) {
      if (!Array.isArray(events)) events = [events]
      events.forEach((event) => {
        if (!event.interpolated) event.interpolated = this.interpolateMentions(event.text, event.tags)
      })
    },

    createMentionsProvider(options) {
      const tribute = new Tribute({
        // spaceSelectsMatch: true,
        // menuShowMinLength: 1,
        menuContainer: document.getElementById('tribute-wrapper'),
        positionMenu: false,

        selectTemplate: item => `@${item.original.value.pubkey}`,

        menuItemTemplate: item => {
          return `
            <div class="flex row no-wrap items-center" style="gap: .2rem; width: 100%;">
              <div style="border-radius: 10px">
                <img src=${this.$store.getters.avatar(item.original.value.pubkey)} style="object-fit: cover; height: 1.5rem; width: 1.5rem;"/>
              </div>
                <div class="text-bold">${item.string}</div>
              ${item.original.value.nip05
                ? '<i class="notranslate material-icons text-accent mr-1 -ml-1" aria-hidden="true" role="presentation">verified</i>'
                : ''}
                <div class="text-secondary caption">${shorten(item.original.value.pubkey)}</div>
              </div>
            `
        },

        values: (_pattern, callback) => {
          callback(
            this.$store.getters
              .namedProfiles
              .map(profile => ({
                key: this.$store.getters.displayName(profile.pubkey),
                value: profile,
              }))
          )
        },

        noMatchTemplate: () => undefined, // hide "No matches"
      })

      return {
        attach: element => tribute.attach(element),
        detach: element => tribute.detach(element),
      }
    },
  }
}
