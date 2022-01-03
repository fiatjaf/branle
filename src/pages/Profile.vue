<template>
  <q-page class="px-4 py-6">
    <div class="text-xl text-center">
      {{ $store.getters.displayName($route.params.pubkey) }}
    </div>

    <div class="flex justify-left items-center mt-4">
      <q-avatar round>
        <img :src="$store.getters.avatar($route.params.pubkey)" />
      </q-avatar>
      <div class="ml-4" style="width: 29rem">
        <p class="mb-1 break-all text-xs font-mono text-secondary">
          {{ $route.params.pubkey }}
        </p>
        <div class="text-slate-600 text-base break-words w-full">
          <Markdown>
            {{ $store.getters.profileDescription($route.params.pubkey) }}
          </Markdown>
        </div>
      </div>
    </div>

    <div
      v-if="$route.params.pubkey !== $store.state.keys.pub"
      class="flex items-center justify-between mt-2 px-2"
    >
      <div class="w-3/5">
        <div v-if="$store.getters.contacts($route.params.pubkey)">
          Following
          <div class="inline">
            <span
              v-for="(user, i) in $store.getters.contacts(
                $route.params.pubkey,
                !showAllContacts
              )"
              :key="user.pubkey"
            >
              <span
                class="text-slate-400 cursor-pointer hover:underline"
                @click="toProfile(user.pubkey)"
                >{{ shorten(user.pubkey) }}</span
              ><span
                v-if="$store.getters.hasName(user.pubkey)"
                class="text-slate-500"
              >
                ({{ $store.getters.displayName(user.pubkey) }})</span
              ><span
                v-if="
                  i + 1 <
                  $store.getters.contacts(
                    $route.params.pubkey,
                    !showAllContacts
                  ).length
                "
                >,
              </span>
            </span>
            <q-icon
              v-if="$store.getters.hasMoreContacts($route.params.pubkey)"
              :name="showAllContacts ? 'expand_less' : 'more_horiz'"
              color="primary"
              class="
                bg-white
                drop-shadow
                cursor-pointer
                border-1
                px-2
                py-1
                ml-1
                -translate-y-1
              "
              @click="showAllContacts = !showAllContacts"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <q-btn
          :disable="!$store.state.keys.priv"
          round
          flat
          :to="'/messages/' + $route.params.pubkey"
          unelevated
          color="primary"
          icon="message"
          size="xl"
        />
        <q-btn
          v-if="isFollowing"
          :disable="!$store.state.keys.priv"
          round
          unelevated
          flat
          color="secondary"
          icon="cancel"
          size="xl"
          @click="unfollow"
        />
        <q-btn
          v-if="!isFollowing"
          :disable="!$store.state.keys.priv"
          round
          unelevated
          color="primary"
          flat
          icon="add_circle"
          size="xl"
          @click="follow"
        />
      </div>
    </div>

    <q-separator class="my-6" />

    <div>
      <div class="text-lg mx-4">Notes</div>
      <Post
        v-for="event in events"
        :key="event.id"
        :event="event"
        standalone
        item
      />
    </div>
  </q-page>
</template>

<script>
import helpersMixin from '../utils/mixin'
import {pool} from '../pool'

export default {
  name: 'Profile',
  mixins: [helpersMixin],

  data() {
    return {
      events: [],
      eventsSet: new Set(),
      sub: null,
      showAllContacts: false
    }
  },

  computed: {
    isFollowing() {
      return this.$store.state.following.includes(this.$route.params.pubkey)
    }
  },

  watch: {
    '$route.params.pubkey'(curr, prev) {
      if (curr && curr !== prev) this.start()
    }
  },

  mounted() {
    this.start()
  },

  beforeUnmount() {
    if (this.sub) this.sub.unsub()
  },

  methods: {
    start() {
      this.$store.dispatch('useProfile', {pubkey: this.$route.params.pubkey})
      this.$store.dispatch('useContacts', this.$route.params.pubkey)
      this.listen()
      this.$store.getters
        .contacts(this.$route.params.pubkey)
        ?.forEach(pubkey => this.$store.dispatch('useProfile', {pubkey}))
    },

    listen() {
      this.events = []
      this.eventsSet = new Set()

      this.sub = pool.sub(
        {
          filter: [
            {
              authors: [this.$route.params.pubkey],
              kinds: [0, 1, 3]
            }
          ],
          cb: async event => {
            switch (event.kind) {
              case 0:
                await this.$store.dispatch('addEvent', event)
                return

              case 1:
                if (this.eventsSet.has(event.id)) return
                this.eventsSet.add(event.id)

                // manual sorting
                // newer events first
                for (let i = 0; i < this.events.length; i++) {
                  if (event.created_at > this.events[i].created_at) {
                    // the new event is newer than the current index,
                    // so we add it at the previous index
                    this.events.splice(i, 0, event)
                    return
                  }
                }

                // the newer event is the oldest, add to end
                this.events.push(event)

                return
            }
          }
        },
        'profile-browser'
      )
    },

    unfollow() {
      this.$store.commit('unfollow', this.$route.params.pubkey)
    },

    follow() {
      this.$store.commit('follow', this.$route.params.pubkey)
    }
  }
}
</script>
