<template>
  <div style='border: 1px solid var(--q-accent); border-radius: .5rem;'>
    <q-expansion-item
      dense
      dense-toggle
      group='info'
      class="no-padding full-width"
      header-class='items-center'
    >
      <template #header>
        <span class='full-width text-bold'>learn about Nostr</span>
      </template>
      <q-card-section>
        <p>
        the <a href='https://github.com/fiatjaf/nostr' target='_blank' rel='noopener noreferrer'>Nostr</a> protocol is
        a decentralized and censorship resistant distributed information network that relies on clients and relays.
        relays store user data. clients communicate with the relays to save and fetch said user data.
        </p>
        <ul>
          <li>users choose which relays to store their data on, meaning no one centralized entity has the power
          to remove your data from the network (so it is recommended to use multiple relays)</li>
          <li>users choose which clients to use, meaning no one centralized website can stop you from accessing the network</li>
          <li>any client can be used with any relay, meaning users can choose their relays and client independently</li>
        </ul>
        <p>
        astral is a client for Nostr. while astral is implementing a social media usecase of Nostr, the possibilities of Nostr are endless.
        <a href='https://jesterui.github.io/#/game/jester1y7du0yq7uzfzhxr2xgd64lmchfpf54evjsa59ff4f2mgh83h79rs9k7ffq'>Jester</a>
        is a beta peer to peer chess client implemented over Nostr.
        </p>
      </q-card-section>
    </q-expansion-item>
    <div style='max-height: 0; border-top: 1px solid var(--q-accent)'/>
    <q-expansion-item
      dense
      dense-toggle
      group='info'
      class="no-padding full-width"
      header-class='items-center'
    >
      <template #header>
        <span class='full-width text-bold'>do I need a key?</span>
      </template>
      <q-card-section>
        <p>
        if you would just like to look around you do not need a key pair, simply close this
        dialog popup. however, if you want to post or save your profile and follows you will
        need to create a key pair if you don't have one already.
        </p>
        <p>
        if you decide to just look around and want to login at a later time hit the set user <q-icon name='login'/>
        button in the user menu.
        </p>
      </q-card-section>
    </q-expansion-item>
    <div style='max-height: 0; border-top: 1px solid var(--q-accent)'/>
    <q-expansion-item
      dense
      dense-toggle
      group='info'
      class="no-padding full-width"
      header-class='items-center'
    >
      <!-- <div class='flex row justify-between'> -->
      <template #header>
        <span class='full-width text-bold'>what is a key pair?</span>
      </template>
      <q-card-section>
        in order to participate in the Nostr network you will need to a public key and private key pair.
        this key pair can be used in any Nostr client to login.
        <q-list bordered padding class="q-mt-sm q-mb-sm">
          <q-item>
            <q-item-section>
              <q-item-label>public key</q-item-label>
              <q-item-label caption>
                publicly known unique ID associated with your user on the Nostr
                network. can be shared freely. others can see your posts or
                follow you using only your public key.
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>private key</q-item-label>
              <q-item-label caption>
                <strong>KEEP THIS SECRET!</strong> secret key used to sign for
                (or unlock) your public key. all content from your user public
                key will need a signature derived from your private key before
                being relayed. if a bad actor discovers your private key they
                can impersonate you on Nostr network and see your encrypted dms.
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <p>
          your public key is created from your private key via a one way hash
          function, meaning:
          <ul>
            <li>your public key can be calculated from your private
            key - which is why you only need to enter your private key for astral to
            know your public key</li>
            <li>your private key cannot be calculated from your public key - which
            is why you can freely share your public key without compromising your
            private key</li>
          </ul>
        </p>
        <p>
          through the magic of cryptograpic functions, this private and public key pair
          allows you to sign for Nostr events, which could represent a post, profile
          settings, or follows list, in a cryptographically verifiable manner (similar to
          how you sign for a bitcoin transaction)
        </p>
        <p>
          you may see your keys displayed in a couple different key formats depending on
          the Nostr client you use, please don't be alarmed. they both represent the same
          byte data, they just use different encoding methods to be human readable. the
          'npub' (for <span style='text-decoration: underline;'>N</span>ostr
          <span style='text-decoration: underline;'>pub</span>lic key) and 'nsec'
          (for <span style='text-decoration: underline;'>N</span>ostr
          <span style='text-decoration: underline;'>sec</span>ret key) format that Damus
          uses is preferable over the hex format that astral uses because there is a visual
          indicator preventing the user from mixing up their public and private key. astral
          will adopt this format in the future.
        </p>
      </q-card-section>
    </q-expansion-item>
    <div style='max-height: 0; border-top: 1px solid var(--q-accent)'/>
    <q-expansion-item
      dense
      dense-toggle
      group='info'
      class="no-padding full-width"
      header-class='items-center'
    >
      <template #header>
        <span class='full-width text-bold'>why shouldn't I enter my private key?</span>
      </template>
      <q-card-section>
        <p>
          anytime you enter your private key into any Nostr client, you are trusting that client to:
          <ol>
            <li>not store your private key</li>
            <li>not have any vulnerabilities that a bad actor can exploit to steal your private key</li>
          </ol>
          while I can promise you that astral does not store your private key (it is stored locally in your
          browser and is NEVER sent to back to astral) and that I am doing my best to prevent vulnerabilities,
          it is still recommeneded that you <strong>DO NOT TRUST ME</strong>.
        </p>
        <p>
          fortunately, on desktop devices Nostr provides an easy way for you to sign into Nostr clients without
          ever providing the client with your private key via browser extensions like
          <a href='https://getalby.com/' target='_blank' rel='noopener noreferrer'>getAlby</a> or <a href='https://github.com/fiatjaf/nos2x#install' target='_blank' rel='noopener noreferrer'>nos2x</a>.
          these browser extensions will store your private key locally
          in your browser. when the client needs to send an event or decrypt your messages (ie. use your
          private key), it will employ your browser extension to do the necessary cryptographic functions.
          see <strong>how to get a key pair?</strong> section below for instructions on how to use these
          browser extensions.
        </p>
        <p>
          unfortunately, on mobile devices you cannot use browser extensions so it will be
          necessary to enter your private key for now. this is a known and important issue
          that is being worked on, and there should be some better solutions for private key
          management on mobile devices coming soon.
        </p>
      </q-card-section>
    </q-expansion-item>
    <div style='max-height: 0; border-top: 1px solid var(--q-accent)'/>
    <q-expansion-item
      dense
      dense-toggle
      group='info'
      class="no-padding full-width"
      header-class='items-center'
    >
      <template #header>
        <span class='full-width text-bold'>how to get a key pair?</span>
      </template>
      <q-card-section>
        <p>
          you can use any method you want to generate your keys, as long as they
          conform to the <a href='https://github.com/nostr-protocol/nips/blob/master/01.md' target='_blank' rel='noopener noreferrer'>Nostr NIP-01</a>
          specification.
          <ul>
            <li>if you are on a desktop device the recommeneded option will be using a browser extension like
              <a href='https://getalby.com/' target='_blank'>getAlby</a> or <a href='https://github.com/fiatjaf/nos2x#install' target='_blank' rel='noopener noreferrer'>nos2x</a>.
              (see <strong>why shouldn't I enter my private key?</strong> section above)</li>
            <li>if you are on a mobile device the easiest option will be using astral</li>
            <li>if you are a technical user who is concerned about key generation security you can try the local option</li>
          </ul>
        </p>
        <p>
          if you already have a key pair and just want to enter it into a browser extension, follow the
          instructions in the applicable sub-section below but enter your private key instead of hitting
          'generate' (with nos2x make sure to hit save afterword)
        </p>
        <p>
          choose your key generation method:
        </p>
        <div style='border: 1px solid var(--q-accent); border-radius: .5rem;'>
          <q-expansion-item
            dense
            dense-toggle
            group='generateKeys'
            class="no-padding full-width"
            header-class='items-center'
          >
            <template #header>
              <span class='full-width text-bold'>use astral</span>
            </template>
            <q-card-section>
              <ol>
                <li>hit <strong>GENERATE KEYS</strong> button below in the key input</li>
                <li>proceed to <strong>how to use astral?</strong> section below</li>
              </ol>
            </q-card-section>
          </q-expansion-item>
          <div style='max-height: 0; border-top: 1px solid var(--q-accent)'/>
          <q-expansion-item
            dense
            dense-toggle
            group='generateKeys'
            class="no-padding full-width"
            header-class='items-center'
          >
            <template #header>
              <span class='full-width text-bold'>use nos2x</span>
            </template>
            <q-card-section>
              <ol>
                <li>install <a href='https://github.com/fiatjaf/nos2x#install' target='_blank' rel='noopener noreferrer'>nos2x</a> browser extension</li>
                <li>open the nos2x extension options page (usually in dropdown when clicking on extension's icon at the top of your broswer)</li>
                <li>hit <strong>generate</strong> button</li>
                <li>refresh astral.ninja page and hit the <strong>USE PUBLIC KEY FROM EXTENSION</strong> option that should appear in the key input</li>
                <li>proceed to <strong>how to use astral?</strong> section below</li>
              </ol>
            </q-card-section>
          </q-expansion-item>
          <div style='max-height: 0; border-top: 1px solid var(--q-accent)'/>
          <q-expansion-item
            dense
            dense-toggle
            group='generateKeys'
            class="no-padding full-width"
            header-class='items-center'
          >
            <template #header>
              <div class='full-width'>
                <span class='text-bold'>use getAlby </span>
                <span>longer setup than nos2x but is password protected, comes with a lightning wallet and is better maintained</span>
              </div>
            </template>
            <q-card-section>
              <ol>
                <li>install <a href='https://getalby.com/' target='_blank' rel='noopener noreferrer'>getAlby</a> browser extension</li>
                <li>complete alby setup (when it asks <strong>Do you have a lightning wallet?</strong> just hit <strong>Alby Wallet</strong>
                  if you do not have one)</li>
                <li>open the getAlby extension options page (usually in dropdown when clicking on extension's icon at the top of your broswer)</li>
                <li>hit the <strong>Settings</strong> tab</li>
                <li>scroll down to the <strong>Nostr</strong> section and hit <strong>Generate</strong></li>
                <li>refresh astral.ninja page and hit the <strong>USE PUBLIC KEY FROM EXTENSION</strong> option that should appear in the key input</li>
                <li>proceed to <strong>how to use astral?</strong> section below</li>
              </ol>
            </q-card-section>
          </q-expansion-item>
          <div style='max-height: 0; border-top: 1px solid var(--q-accent)'/>
          <q-expansion-item
            dense
            dense-toggle
            group='generateKeys'
            class="no-padding full-width"
            header-class='items-center'
          >
            <template #header>
              <span class='full-width text-bold'>use local machine</span>
            </template>
            <q-card-section>
              <ol>
                <li>open terminal</li>
                <li>enter the command <pre>openssl rand -hex 32</pre></li>
                <li>proceed to <strong>how to use astral?</strong> section below</li>
              </ol>
            </q-card-section>
          </q-expansion-item>
        </div>
      </q-card-section>
    </q-expansion-item>
    <div style='max-height: 0; border-top: 1px solid var(--q-accent)'/>
    <q-expansion-item
      dense
      dense-toggle
      group='info'
      class="no-padding full-width"
      header-class='items-center'
    >
      <template #header>
        <span class='full-width text-bold'>how to use astral?</span>
      </template>
      <q-card-section>
        <ol>
          <li>
            <strong>enter your key</strong> if you don't have a key pair, or you have a key pair that you want to enter into
            a Nostr browser extension, see <strong>how to get a key pair?</strong> section above.
          </li>
          <li>
            <strong>choose bootstrap relays (optional)</strong> this section will only appear once a valid key has
            been entered. if you are using a brand new key you don't need
            to worry about this. if you are using an existing key and don't typically use any of the selected
            relays, make sure to include a relay you typically use or astral may not be able to find your user.
            the bootstrap relays are NOT used as your user's relay list, astral only uses these to find your
            user's information and settings when loading your Nostr account.
          </li>
          <li>
            <strong>hit PROCEED</strong> astral will login and attempt to find your user information. please
            be patient as it can take a few minutes to completely sync with Nostr relays.
          </li>
          <li>
            <strong>BACK UP YOUR KEYS!!!</strong> once you are taken to the settings page you should get a
            popup displaying your Nostr keys. make sure to make a backup of your Nostr keys and keep it
            somewhere safe. if you lose your Nostr keys you lose access to your Nostr user identity. there is no
            astral customer service to reset your password.
          </li>
          <li>
            <strong>edit settings</strong> hit the <strong>EDIT</strong> button for which ever section you would
            like to edit.
            <ul>
              <li><strong>profile</strong> saving this section will broadcast your updated user profile to the
              Nostr relays (if you have never set your relays on Nostr, astral will use astral's default relay
              list to set and broadcast your set Nostr relays at the same time). all fields in the profile are
              completely optional, you don't need to set a profile at all to use Nostr.
                <ul>
                  <li><strong>name</strong> non-unique username that will be displayed accross Nostr</li>
                  <li><strong>about</strong> share a little about yourself</li>
                  <li><strong>picture</strong> image url for the picture you would like displayed as your Nostr
                  profile picture</li>
                  <li><strong>NIP-05 Identifier</strong> meant to be a unique, human readable identifier for
                  Nostr (read more <a href='https://github.com/nostr-protocol/nips/blob/master/05.md' target='_blank' rel='noopener noreferrer'>here</a>)
                  </li>
                </ul>
              </li>
              <li><strong>preferences</strong> saving this section will update the look of astral for this browser.
              this section is not synced to Nostr.</li>
              <li><strong>relays</strong> saving this section will broadcast your updated relay list to the
              Nostr relays.</li>
            </ul>
          </li>
        </ol>
      </q-card-section>
    </q-expansion-item>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseIssues',
})
</script>
