import createHash from 'create-hash'
import {serializeEvent} from 'nostr-tools'
import {Buffer} from 'buffer'

const jobRunner = createJobRunner()

self.onmessage = event => {
  let {jobId, data, targetBits, cancel, cancelReason} = JSON.parse(event.data)

  if (cancel) {
    if (jobRunner.isJob(jobId)) {
      jobRunner.cancelJob(jobId, cancelReason)
    }

    return
  }

  jobRunner.addJob(jobId, data, targetBits)
}

function createJobRunner() {
  const jobs = {}
  let interval
  let running = false

  const isJob = jobId => jobId in jobs

  const stop = () => {
    clearInterval(interval)
    running = false
  }

  const start = () => {
    running = true
    interval = setInterval(() => {
      for (const jobId in jobs) {
        try {
          const result = jobs[jobId].miner.next()

          if (result.done) {
            jobs[jobId].reply({
              data: result.value
            })

            deleteJob(jobId)
          }
        } catch (error) {
          if (error.message === 'cancelled') {
            console.warn(`mining: worker: miner cancelled: jobId:${jobId}`)
            jobs[jobId].reply({
              cancelled: true
            })
          } else {
            console.error(
              `mining: worker: error consuming: jobId:${jobId} message:${error.message}`
            )
            jobs[jobId].reply({
              error: true,
              errorMessage: error.message
            })
          }
        }
      }
    }, 1)
  }

  const addJob = (jobId, data, targetBits) => {
    jobs[jobId] = {
      miner: createMiner(data, targetBits),
      reply: response => self.postMessage(JSON.stringify({jobId, ...response}))
    }

    if (!running) {
      start()
    }
  }

  const cancelJob = (jobId, reason = 'cancelled') => {
    const miner = jobs[jobId].miner
    miner.throw(new Error(reason)) // unwind the generator

    jobs[jobId].reply({
      cancelled: true,
      cancelReason: reason
    })
    deleteJob(jobId)
  }

  const deleteJob = jobId => {
    delete jobs[jobId]

    if (!Object.keys(jobs).length) {
      stop()
    }
  }

  return {
    addJob,
    cancelJob,
    isRunning: () => running,
    isJob
  }
}

// eslint-disable-next-line generator-star-spacing
function* createMiner(event, targetBits) {
  try {
    const clonedEvent = JSON.parse(JSON.stringify(event))

    let nonce = 0
    const nonceTag = ['nonce', {toJSON: () => nonce.toString()}]
    clonedEvent.tags = clonedEvent.tags ? [...clonedEvent.tags, nonceTag] : [nonceTag]

    let hash, bits
    do {
      hash = getEventHashAsBuffer(clonedEvent)
      bits = hashMsb(hash)

      console.debug(
        `mining: worker: mined: bits:${bits} nonce:${nonce} hash:${hash.toString(
          'hex'
        )}`
      )

      if (bits >= targetBits) {
        return clonedEvent
      }

      yield clonedEvent

      nonce++
    } while (true)
  } catch (err) {
    console.error(`mining: worker: error: ${err.message}`)
  }
}

function msb(byte) {
  let rightShiftCounts = 0

  if (byte === 0) {
    return 8
  }

  while ((byte >>= 1)) {
    rightShiftCounts++
  }

  return 7 - rightShiftCounts
}

function hashMsb(hash) {
  let result, i, bits

  for (i = 0, result = 0; i < hash.length; i++) {
    bits = msb(hash[i])
    result += bits

    if (bits !== 8) {
      break
    }
  }

  return result
}

// Adapted from fiatjaf's nostr-tools to return buffer: https://github.com/fiatjaf/nostr-tools/blob/master/event.js
function getEventHashAsBuffer(event) {
  let eventHash = createHash('sha256')
    .update(Buffer.from(serializeEvent(event)))
    .digest()
  return Buffer.from(eventHash)
}
