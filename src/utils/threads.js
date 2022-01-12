export function addToThread(threads, event) {
  // filter just tagged event ids from tags
  let refs = event.tags.filter(([t, v]) => t === 'e' && v)

  let thread =
    refs.length >= 2 &&
    threads.find(threadEvents => {
      return threadEvents.find(tevt => {
        return refs.find(([_, v]) => tevt.id === v)
      })
    })

  if (thread) {
    // this is a member of an existing thread
    thread.push(event)

    // sort thread according to internal thread tag hierarchy
    thread.sort((a, b) => {
      if (a.tags.find(([_, v]) => v === b.id)) {
        // a has a reference to b, sort b before a
        return 1
      } else if (b.tags.find(([_, v]) => v === a.id)) {
        // b has a reference to a, sort a before b
        return -1
      } else {
        // doesn't matter
        return 0
      }
    })
  } else {
    // its own thread

    // manual sorting
    // newer events first
    for (let i = 0; i < threads.length; i++) {
      if (event.created_at > threads[i][0].created_at) {
        // the new event is newer than the current index,
        // so we add it at the previous index
        threads.splice(i, 0, [event])
        return
      }
    }

    // the newer event is the oldest, add to end
    threads.push([event])
  }
}
