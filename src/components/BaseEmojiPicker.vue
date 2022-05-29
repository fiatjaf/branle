<template>
  <Picker
    :data='emojiIndex'
    :native='true'
    :emoji-size='16'
    :per-line='perLine'
    :show-preview='false'
    :show-skin-tomes='false'
    @select='emojiSelected'
    @click.stop
  />
</template>

<script>
import data from 'emoji-mart-vue-fast/data/all.json'
// Note: component needs to be imported from /src subfolder:
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src'
import 'emoji-mart-vue-fast/css/emoji-mart.css'
let emojiIndex = new EmojiIndex(data)

export default {
  name: 'BaseEmojiPicker',
  emits: ['emoji-selected'],
  props: {
    // postEntryAlignment (post-entry-alignment) should be 'column' or 'row'
    // expandDirection: {
    //   type: String,
    //   required: false,
    //   default: 'down'
    // },
    perLine: {
      type: Number,
      required: true,
    },
  },
  components: {
    Picker,
  },

  data() {
    return {
      emojiIndex: emojiIndex
    }
  },

  methods: {
    emojiSelected(emoji) {
      this.$emit('emoji-selected', emoji)
    }
  }
}
</script>

<style lang='scss'>
.emoji-mart {
  flex-direction: row;
  background: inherit;
  color: inherit;
  height: 10rem;
  position: relative;
  border: 0;
  z-index: 1;
  width: 100%;
}
.emoji-mart-bar {
  border: 0;
}
.emoji-mart-anchors {
  flex-direction: column;
  color: inherit;
  padding: 0;
}
.emoji-mart-anchor {
  color: inherit;
  opacity: .6;
  padding: 0;
  border: 0;
  object-fit: cover;
  height: 1rem;
}
.emoji-mart-anchor svg {
  transform: scale(.8)
}
.emoji-mart-anchor:hover {
  color: inherit;
  opacity: 1;
}
.emoji-mart-anchor-selected {
  color: $accent !important;
  border-bottom: 0;
}
.emoji-mart-anchor-bar {
  display: none;
  visibility: hidden;
}
.emoji-mart-category{
  line-height: 0;
}
.emoji-mart-search {
  position: absolute;
  top: 0;
  left: 1.5rem;
  margin: 0;
  z-index: 2;
}
.emoji-mart-search input {
  background:  rgba(255, 255, 255, 0.1);
  color: inherit;
  border: 0;
}
.emoji-mart-category-label h3 {
  background-color: unset;
  background-color: unset;
  color: inherit;
  padding: .1rem;
  margin: 0;
  font-size: .8rem;
  text-transform: lowercase;
  font-weight: 400;
}
.emoji-mart-scroll {
  margin-top: 2rem;
}
div#emoji-mart-list section:first-of-type h3:first-of-type {
  padding-top: 0;
}
.emoji-mart-emoji {
  padding: .3rem;
}
.emoji-mart-emoji:hover:before {
  display: none;
}
button.emoji-mart-emoji {
  align-items: center;
  justify-content: flex-start;
}
</style>
