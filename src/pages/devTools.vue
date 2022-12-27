<template>
  <q-page>
    <BaseHeader>{{ $t('devTools') }}</BaseHeader>
    <div class='q-py-md q-px-sm'>
      <q-tabs
        v-model="tab"
        dense
        outline
        align="left"
        active-color='accent'
      >
        <q-tab name="keyConverter" label='key converter' />
        <q-tab name="sqlQuery" label='sql query' />
      </q-tabs>
      <!-- <div class="text-bold">sql query</div> -->
      <q-tab-panels v-model="tab">
        <q-tab-panel name="keyConverter" class='flex column items-center full-width' style='gap: .5rem; background: var(--q-background)'>
          <q-input v-model='keys.bech32' filled dense label='enter "npub", "note" key here' class='full-width'>
            <template #append>
              <BaseButtonCopy color="secondary" :button-text='keys.bech32'/>
            </template>
          </q-input>
          <div> - or - </div>
          <div class='flex row no-wrap full-width' style='gap: 1rem;'>
            <q-input v-model='keys.prefix' filled dense label='prefix' style='width: 10rem;'/>
            <q-input v-model='keys.hex' filled dense label='enter hex key here' class='full-width'>
              <template #append>
                <BaseButtonCopy color="secondary" :button-text='keys.hex'/>
              </template>
            </q-input>
          </div>
          <q-btn spread label='convert' color='primary' outline class='full-width q-mt-md' @click='convertKeys'/>
        </q-tab-panel>

        <q-tab-panel name="sqlQuery">
          <TheSqlEditor/>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import helpersMixin from '../utils/mixin'
import { Notify, createMetaMixin } from 'quasar'
import BaseButtonCopy from '../components/BaseButtonCopy'
import TheSqlEditor from '../components/TheSqlEditor'

const metaData = {
  // sets document title
  title: 'astral - dev tools',

  // meta tags
  meta: {
    description: { name: 'description', content: 'dev tools for astral Nostr client' },
    keywords: { name: 'keywords', content: 'nostr decentralized social media' },
    equiv: { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
  },
}

export default defineComponent({
  name: 'DevTools',
  mixins: [helpersMixin, createMetaMixin(metaData)],

  components: {
    BaseButtonCopy,
    TheSqlEditor,
    // BaseUserCard,
  },

  data() {
    return {
      codeEditor: null,
      tictime: null,
      sql: 'SELECT * FROM nostr_events;\n-- SELECT * FROM nostr_users;',
      // sql: 'SELECT * FROM nostr;',
      // results: [],
      rows: [],
      // rowKey: 'id',
      // columns: [],
      tab: 'keyConverter',
      keys: {
        hex: '',
        bech32: '',
        prefix: '',
      }
    }
  },

  methods: {
    convertKeys() {
      if (this.keys.bech32 && this.isBech32Key(this.keys.bech32)) this.keys.hex = this.bech32ToHex(this.keys.bech32)
      else if (this.keys.hex && this.isKey(this.keys.hex)) this.keys.bech32 = this.hexToBech32(this.keys.hex, this.keys.prefix)
      else Notify.create({
      message: `invalid key entered`,
      color: 'negative'
    })
    },
    // handleError(e) {
    //   let src = e.target.src
    //   let proxySrc = `https://api.codetabs.com/v1/proxy?quest=${src}`
    //   e.target.src = proxySrc
    // }
  }
})
</script>

<style lang='scss' scoped>
.q-tabs {
  border-bottom: 1px solid $accent
}
</style>
