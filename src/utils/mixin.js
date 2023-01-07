import Tribute from 'tributejs'
import {shorten} from './helpers'
// import { stringify } from 'JSON'
import {date} from 'quasar'
import { dbStreamEvent } from 'src/query'
import {decrypt} from 'nostr-tools/nip04'
// import { decode, encode } from 'bech32-buffer'
import { bech32 } from 'bech32'
import * as DOMPurify from 'dompurify'
import { utils } from 'lnurl-pay'
import { Buffer } from 'buffer'
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
      this.$router.push('/' + this.hexToBech32(pubkey, 'npub'))
    },

    toEvent(id) {
      this.$router.push('/' + this.hexToBech32(id, 'note'))
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
          return `[${shorten(this.hexToBech32(eventId, 'note'))}](/${this.hexToBech32(eventId, 'note')})`
        } else if (tags[Number(index)][0] === 'p') {
          const profile = tags[Number(index)][1]
          const displayName = this.$store.getters.displayName(profile)
          return `[${displayName}](/${this.hexToBech32(profile, 'npub')})`
        }
      }
      const hashtagReplacer = (match, startWhitespace, hashtag) => {
        return `${startWhitespace}[${match}](/hashtag/${hashtag})`
      }
      const untaggedProfileReplacer = (match, profile) => {
        const displayName = this.$store.getters.displayName(profile)
        return `[@${displayName}](/${profile})`
      }

      let replacedText = text.replace(/#\[(\d+)\]/g, replacer)
      let hashtagReplacedText = replacedText.replace(/(?<s>^|[\s])#([\w]{1,63})\b/g, hashtagReplacer)
      let untaggedProfileReplacedText = hashtagReplacedText.replace(/@([\w]{64})/g, untaggedProfileReplacer)
      let replacedTextFinal = untaggedProfileReplacedText

      let rootIdx = tags.findIndex(([t, v, _, marker]) => (t === 'e') && v && marker === 'root')
      if (rootIdx >= 0) {
        let [_, v] = tags[rootIdx]
        if (!mentions.mentionEvents.includes(v) && mentions.replyEvents.length < 2) mentions.replyEvents.push(v)
        let replyIdx = tags.find(([t, v, _, marker]) => (t === 'e') && v && marker === 'reply')
        if (replyIdx >= 0) {
          let [_, v] = tags[replyIdx]
          if (!mentions.mentionEvents.includes(v) && mentions.replyEvents.length < 2) mentions.replyEvents.push(v)
        }
      }
      tags.filter(([t, v, _, marker]) => (t === 'e') && v && marker === 'mention').forEach(([t, v], index) => {
        if (!mentions.mentionEvents.includes(v)) mentions.mentionEvents.push(v)
      })
      tags.filter(([t, v]) => (t === 'e') && v).forEach(([t, v], index) => {
        if (!mentions.mentionEvents.includes(v) && !mentions.replyEvents.includes(v)) {
          // if (index < 2) mentions.replyEvents.push(v)
          if (mentions.replyEvents.length < 2) mentions.replyEvents.push(v)
          else mentions.mentionEvents.push(v)
        }
      })

      return {
        text: DOMPurify.sanitize(replacedTextFinal),
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

        selectTemplate: item => `${this.hexToBech32(item.original.value.pubkey, 'npub')}`,

        menuItemTemplate: item => {
          return `
            <div class="flex row no-wrap items-center" style="gap: .2rem; width: 100%;">
              <div style="border-radius: 10px">
                <img src=${this.$store.getters.avatar(item.original.value.pubkey)} style="object-fit: cover; height: 1.5rem; width: 1.5rem;"/>
              </div>
                <div class="text-bold">${item.string}</div>
              ${this.$store.state.follows.includes(item.original.value.pubkey)
                ? '<i class="notranslate material-icons text-secondary mr-1 -ml-1" aria-hidden="true" role="presentation">visibility</i>'
                : ''}
              ${item.original.value.nip05
                ? '<i class="notranslate material-icons text-accent mr-1 -ml-1" aria-hidden="true" role="presentation">verified</i>'
                : ''}
                <div class="text-secondary text-caption">${shorten(this.hexToBech32(item.original.value.pubkey, 'npub'))}</div>
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

    isKey(key) {
      if (!key || typeof key !== 'string') return false
      // console.log('isKey:', `"${key}"`, typeof key, /^[0-9a-f]{64}$/.test(key?.toLowerCase()))
      return /^[0-9a-f]{64}$/.test(key?.toLowerCase())
    },

    isBech32Key(key) {
      if (typeof key !== 'string') return false
      try {
        let { prefix } = bech32.decode(key.toLowerCase())
        if (!['npub', 'nsec'].includes(prefix)) return false
        if (prefix === 'npub') this.watchOnly = true
        if (prefix === 'nsec') this.watchOnly = false
        return this.isKey(this.bech32ToHex(key))
      } catch (error) {
        console.log('isBech32Key error: ', error)
      }
      return false
    },

    bech32ToHex(key) {
      try {
        let { words } = bech32.decode(key)
        let buffer = Buffer.from(bech32.fromWords(words))
        return this.toHexString(buffer)
      } catch (error) {
        console.log('bech32ToHex error: ', error)
      }
      return ''
    },
// note14s4haycwqpzpdfhm68wlmpwz4rrmlya9e3eeet9p50jekpk023zsrkfr69
// npub19hmfe5xx4w27pr6xd2l8kwdmvnn5fm33llpsg8e8p007c23hasrq9ja0z2
    hexToBech32(key, prefix) {
      try {
        // let buffer = this.fromHexString(key)
        let words = bech32.toWords(this.fromHexString(key))
        return bech32.encode(prefix, words)
      } catch (error) {
        // continue
      }
      return ''
    },
// 8c0da4862130283ff9e67d889df264177a508974e2feb96de139804ea66d6168
// 8c0da4862130283ff9e67d889df264177a508974e2feb96de139804ea66d6168
    toHexString(buffer) {
      let hexString = buffer.reduce((s, byte) => {
        let hex = byte.toString(16)
        if (hex.length === 1) hex = '0' + hex
        return s + hex
      }, '')
      // hexString = JSON.stringify(JSON.parse(hexString))
      return hexString
    },

    fromHexString(str) {
      if (str.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(str)) {
        return null
      }
      let buffer = new Uint8Array(str.length / 2)
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = parseInt(str.substr(2 * i, 2), 16)
      }
      return buffer
    },

    lnurlToLnAddr(lnurl) {
      try {
        let url = utils.decodeUrlOrAddress(lnurl)
        if (!url) return null
        console.log('lnurlToLnAddr', url)
        let lnAddrRegex = /^https:\/\/(?<domain>[a-zA-z0-9.]+)\/.well-known\/lnurlp\/(?<user>[a-zA-Z0-9_-]+)/
        let lnAddrMatch = url.match(lnAddrRegex)
        if (lnAddrMatch) return `${lnAddrMatch.groups.user}@${lnAddrMatch.groups.domain}`
      } catch (error) {
        // console.log('lnurlToLnAddr error: ', error, ' for ', lnurl)
      }
      return null
    },
    lnAddrToLnurl(lnAddr) {
      try {
        if (!utils.isLightningAddress(lnAddr)) return null
        let url = utils.decodeUrlOrAddress(lnAddr)
        let words = bech32.toWords(Buffer.from(url, 'utf8'))
        let lnurl = bech32.encode('lnurl', words, 2000)
        // let lnurl = utils.parseLnUrl(url)
        return lnurl
      } catch (error) {
        // console.log('lnAddrToLnurl error: ', error, ' for ', lnAddr)
      }
    },
  }
}

// npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6
// npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6
// npub1xd3xvvrrxcekvcmz8yengd3nxscrwctx8ymkzdt9x4jk2d35vessj5nvny
