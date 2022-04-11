const worker = new Worker(new URL('./pow-worker.js', import.meta.url))

/**
 * Cancel jobs running longer than JOB_CANCEL_TIMEOUT milliseconds
 */
const JOB_CANCEL_TIMEOUT = 60000

const jobs = {}

worker.onmessage = event => {
  let {jobId, data, cancelled, cancelReason, error, errorMessage} = JSON.parse(
    event.data
  )

  console.debug('mining: pow: received', JSON.parse(event.data))

  if (!jobs[jobId]) return

  if (cancelled) {
    jobs[jobId].reject?.(new Error(cancelReason ?? 'cancelled'))
    delete jobs[jobId]
  } else if (error) {
    jobs[jobId].reject?.(new Error(errorMessage ?? 'error'))
    delete jobs[jobId]
  } else if (data) {
    jobs[jobId].resolve?.(data)
    delete jobs[jobId]
  }
}

export function mine(event, targetBits = 10) {
  let jobId = Math.random().toString().slice(-6)

  const p = new Promise((resolve, reject) => {
    jobs[jobId] = {resolve, reject}
  })
  const cancel = (cancelReason = 'user request') =>
    worker.postMessage(JSON.stringify({jobId, cancel: true, cancelReason}))

  worker.postMessage(JSON.stringify({jobId, data: event, targetBits}))

  // schedule cancellation
  const cancelTimeout = setTimeout(() => cancel('time out'), JOB_CANCEL_TIMEOUT)
  Promise.allSettled([p]).then(() => clearTimeout(cancelTimeout))

  p.cancel = cancel

  return p
}
