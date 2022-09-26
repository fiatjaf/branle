import Tribute from 'tributejs'
import {shorten} from './helpers'
// import { stringify } from 'JSON'
import {date} from 'quasar'
import { dbStreamEvent } from 'src/query'
import {decrypt} from 'nostr-tools/nip04'
const { formatDate } = date


function formatDateI18n(date, format) {
  return formatDate(date, format, {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysShort: ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  })
}

function formatDateUTC(value, verbose = false) {
  let date = new Date(value * 1000)
  let dateUtc = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    )
  let now = Date.now()
  if (now - dateUtc.getTime() < (1000 * 60 * 60 * 24 * 365) && now > dateUtc.getTime()) {
    if (verbose) return formatDateI18n(dateUtc, 'ddd D MMMM')
    return formatDateI18n(dateUtc, 'D MMMM')
  }
  if (verbose) return formatDateI18n(dateUtc, 'ddd D MMMM YYYY')
  return formatDateI18n(dateUtc, 'D MMMM YYYY')
}

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

    toEvent(id) {
      if (!window.getSelection().toString().length) this.$router.push('/event/' + id)
    },

    shorten,

    // niceDate(value) {
    //   // if (value + 60 * 60 /* an hour */ > Date.now() / 1000) {
    //   //   return relative(value * 1000)
    //   // }

    //   // return date.formatDate(value * 1000, 'YYYY MMM D h:mm A')
    //   let niceDateString = timeAgo.format(value * 1000, 'twitter-now')
    //   if (niceDateString.includes(' ')) return niceDateString
    //   else return niceDateString + ' ago'
    // },

    niceDateUTC(value) {
      let now = Math.floor(Date.now() / 1000)
      if (value > now) return formatDateUTC(value)
      if (value === now) return this.$t('now')
      let seconds = now - value
      if (seconds < 60) return `${seconds}${this.$t('s')}`
      let minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `${minutes}${this.$t('m')}`
      let hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}${this.$t('h')}`
      return formatDateUTC(value)
    },

    dateUTC(value) {
      return formatDateUTC(value, true)
    },


    timeUTC(value) {
      let date = new Date(value * 1000)
      return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} ${this.$t('UTC')}`
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
                <img src=${this.$store.getters.avatar(item.original.value.pubkey)} crossorigin style="object-fit: cover; height: 1.5rem; width: 1.5rem;"/>
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


    async processTaggedEvents(ids, events) {
      // let tagged = event.tags.filter(([t, v]) => t === 'e' && v).map(([t, v]) => v)
      // // console.log('processing tagged events for: ', event, tagged)
      // tagged.splice(10)
      // event.taggedEvents = []
      if (!Array.isArray(events)) throw new Error('no array supplied')
      ids.splice(10)
      // this.subTaggedEvents(tagged, event.taggedEvents)
      let eventSubs = {}
      for (let id of ids) {
        eventSubs[id] = await dbStreamEvent(id, async ev => {
          // ev = JSON.parse(ev)
          this.$store.dispatch('useProfile', { pubkey: ev.pubkey })
          if (ev.kind === 1 || ev.kind === 2) this.interpolateEventMentions(ev)
          else if (ev.kind === 4) {
            ev.text = await this.getPlaintext(ev)
            this.interpolateMessageMentions(ev)
          }
          if (Array.isArray(events)) events.push(ev)
          else console.log('processTaggedEvents events not array', ids, ev, events)
          // event.taggedEvents.push(ev)
          eventSubs[id].cancel()
        })
      }
    },

    async getPlaintext(event) {
      if (
        event.tags.find(
          ([tag, value]) => tag === 'p' && value === this.$store.state.keys.pub
        )
      ) {
        // it is addressed to us
        // decrypt it
        return await this.decrypt(event.pubkey, event.content)
      } else if (event.pubkey === this.$store.state.keys.pub) {
        // it is coming from us
        let [_, target] = event.tags.find(([tag]) => tag === 'p')
        // decrypt it
        return await this.decrypt(target, event.content)
      }
    },

    async decrypt(peer, ciphertext) {
      try {
        if (this.$store.state.keys.priv) {
          return decrypt(this.$store.state.keys.priv, peer, ciphertext)
        } else if (
          (await window?.nostr?.getPublicKey?.()) === this.$store.state.keys.pub
        ) {
          return await window.nostr.nip04.decrypt(peer, ciphertext)
        } else {
          throw new Error('no private key available to decrypt!')
        }
      } catch (err) {
        return '???'
      }
    },

  }
}
