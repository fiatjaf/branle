import {addSorted} from './helpers'

export function addToThread(threads, event) {
  // filter just tagged event ids from tags
  let refs = event.tags.filter(([t, v]) => t === 'e' && v).map(([_, v]) => v)
  if (refs.length === 0) {
    // this event starts its own thread
    addSorted(threads, [event], (a, b) => a[0].created_at < b[0].created_at)
    return
  }

  // find the thread this is in as an immediate reply
  for (let i = 0; i < threads.length; i++) {
    let thread = threads[i]
    if (thread[thread.length - 1].id === refs[refs.length - 1]) {
      // found one
      thread.push(event)
      return
    }
  }

  // otherwise search across all events in the existing threads
  // as this event could be a reply to another event in the middle of an existing thread
  for (let i = 0; i < threads.length; i++) {
    let thread = threads[i]
    for (let j = 0; j < thread.length; j++) {
      if (thread[j].id === refs[refs.length - 1]) {
        // in this case we copy the thread up to this point and add the new event to it
        threads.push(thread.slice(0, j + 1).concat(event))
        return
      }
    }
  }

  // if we still haven't found anything, let's see if this event fits a position
  // at the start of one of the threads we have
  for (let i = 0; i < threads.length; i++) {
    let thread = threads[i]
    if (thread[0].tags.filter(([t, v]) => t === 'e' && v).slice(-1)[1]) {
      thread.unshift(event)
      return
    }
  }

  // lastly, as we have no other alternative, push this event as its own thread
  addSorted(threads, [event], (a, b) => a[0].created_at < b[0].created_at)
}
