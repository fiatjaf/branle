import {relayPool} from 'nostr-tools'

export const pool = relayPool()

pool.setPolicy('randomChoice', 3)
