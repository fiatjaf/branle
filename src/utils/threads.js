import {addSorted} from './helpers'

function calcReplyTags(event, route) {
  if (event.interpolated.replyEvents.length) return event.interpolated.replyEvents
  else if (route === 'feed') return event.interpolated.mentionEvents
  else return []
}

function searchAndUpdateThreads(threads, route, ...events) {
  // scenarios:
  // 1) new post event
    // -belongs to a reply thread
    // -sort as new thread
  // 2) reply event
    // -belongs to a reply or new post thread
      // -before beginning of reply thread
      // -beginning of reply thread
      // -middle of reply thread
      // -end of reply or new post thread
      // -after end of reply or new post thread
    // -sort as new thread
  // 3) reply of reply
  // ---------------------------
  // filter just tagged event ids from tags
  if (events[events.length - 1].replies?.length) events[0].latest_created_at = events[events.length - 1].replies.reduce((acc, curr) =>
    Math.max(acc, curr[0].latest_created_at), events[events.length - 1].latest_created_at)
  else events[0].latest_created_at = events[events.length - 1].latest_created_at
  let event = events[0]
  let refs = calcReplyTags(event, route)
  let unshiftThreads = []
  let pushThreads = []
  let insertThreads = []
  let replyInsertThreads = []
  for (let i = 0; i < threads.length; i++) {
    let thread = threads[i]
    let thread0 = thread[0]
    let thread0Refs = calcReplyTags(thread0, route)

    // new post event
    if (refs.length === 0) {
      // check if tread is a reply of event
      if (thread0Refs.length && thread0Refs[thread0Refs.length - 1] === event.id)
        unshiftThreads.push(i)
      continue
      // check if event has same root event as thread
    } else if ((thread0Refs[0] || thread[0].id) === refs[0]) {
      // check if event is equal depth as thread
      if (refs[0] === thread0Refs[0] &&
        refs[refs.length - 1] === thread0Refs[thread0Refs.length - 1]) {
        continue
      }
      // check if event belongs in front of thread
      if (thread0Refs.length && thread0Refs[thread0Refs.length - 1] === event.id) {
        unshiftThreads.push(i)
      }
      // check if event belongs at end of thread
      let threadLast = thread[thread.length - 1]
      if (refs[refs.length - 1] === threadLast.id) {
        pushThreads.push(i)
      }
      if (pushThreads.length === 0) {
        // check if event belongs in middle of a thread
        let threadIndex = thread.findIndex((threadEvent) => refs[refs.length - 1] === threadEvent.id)
        if (threadIndex >= 0) {
          insertThreads.push({thread: i, threadIndex})
        // check if event could belong in last event replies
        } else if (threadLast.created_at < event.created_at && threadLast.replies?.length) {
          replyInsertThreads.push(i)
        }
      }
    }
  }

  if (unshiftThreads.length === 0 && pushThreads.length === 0 && insertThreads.length === 0 && replyInsertThreads.length === 0) return false
  if (pushThreads.length > 1 || insertThreads.length > 1 || (pushThreads.length && insertThreads.length)) {
    return false
  }
  if (unshiftThreads.length) {
    if (unshiftThreads.length === 1 && events.length === 1) {
      let thread = threads[unshiftThreads[0]]
      thread.unshift(event)
      if (thread[thread.length - 1].replies?.length) thread[0].latest_created_at = thread[thread.length - 1].replies.reduce((acc, curr) =>
        Math.max(acc, curr[0].latest_created_at), thread[thread.length - 1].latest_created_at)
      else thread[0].latest_created_at = thread[thread.length - 1].latest_created_at
    } else if (unshiftThreads.length >= 1) {
      if (events.length > 1) {
        event.replies.push(events.slice(1))
      }
      for (let j = unshiftThreads.length - 1; j >= 0; j--) {
        event.replies.push(threads[unshiftThreads[j]])
        threads.splice(unshiftThreads[j], 1)
        pushThreads = pushThreads.map(i => i > j ? i - 1 : i)
        insertThreads = insertThreads.map(({thread, threadIndex}) => thread > j ? {thread: thread - 1, threadIndex} : {thread, threadIndex})
        replyInsertThreads = replyInsertThreads.map(i => i > j ? i - 1 : i)
      }
      event.latest_created_at = event.replies.reduce((acc, curr) => Math.max(acc, curr[0].latest_created_at), event.latest_created_at)
      events = [event]
      if (pushThreads.length === 0 && insertThreads.length === 0 && replyInsertThreads.length === 0) {
        addSorted(threads, events, (a, b) => a[0].latest_created_at < b[0].latest_created_at)
        return true
      }
    }
  }

  if (pushThreads.length) {
    let thread = threads[pushThreads[0]]
    if (thread[thread.length - 1].replies?.length) {
      if (unshiftThreads.length === 1 && events.length === 1) {
        thread[thread.length - 1].replies.push(threads[unshiftThreads[0]])
        threads.splice(unshiftThreads[0], 1)
        insertThreads = insertThreads.map(({thread, threadIndex}) => thread > unshiftThreads[0] ? {thread: thread - 1, threadIndex} : {thread, threadIndex})
        replyInsertThreads = replyInsertThreads.map(i => i > unshiftThreads[0] ? i - 1 : i)
      } else thread[thread.length - 1].replies.push(events)
      thread[0].latest_created_at = thread[thread.length - 1].replies.reduce((acc, curr) =>
        Math.max(acc, curr[0].latest_created_at), thread[thread.length - 1].latest_created_at)
    } else {
      if (unshiftThreads.length === 1 && events.length === 1) {
        thread.push(...threads[unshiftThreads[0]])
        threads.splice(unshiftThreads[0], 1)
      } else thread.push(...events)
      thread[0].latest_created_at = thread[thread.length - 1].latest_created_at
    }
    return true
  }
  if (insertThreads.length) {
    let thread = threads[insertThreads[0].thread]
    let index = insertThreads[0].threadIndex
    if (!thread[index].replies) thread[index].replies = []
    let slicedReply = thread.slice(index + 1)
    slicedReply[0].latest_created_at = slicedReply[slicedReply.length - 1].latest_created_at
    thread[index].replies.push(slicedReply)
    thread.splice(index + 1, thread.length - index)
    if (unshiftThreads.length === 1 && events.length === 1) {
      thread[index].replies.push(threads[unshiftThreads[0]])
      threads.splice(unshiftThreads[0], 1)
    } else thread[index].replies.push(events)
    thread[0].latest_created_at = thread[thread.length - 1].replies.reduce((acc, curr) =>
      Math.max(acc, curr[0].latest_created_at), thread[thread.length - 1].latest_created_at)
    return true
  }
  if (replyInsertThreads.length) {
    for (let i in replyInsertThreads) {
      let thread = threads[replyInsertThreads[i]]
      if (unshiftThreads.length === 1 && events.length === 1) {
        let inserted = searchAndUpdateThreads(thread[thread.length - 1].replies, route, ...threads[unshiftThreads[0]])
        if (inserted) {
          threads.splice(unshiftThreads[0], 1)
          thread[0].latest_created_at = thread[thread.length - 1].replies.reduce((acc, curr) =>
            Math.max(acc, curr[0].latest_created_at), thread[thread.length - 1].latest_created_at)
          return true
        }
      } else {
        let inserted = searchAndUpdateThreads(thread[thread.length - 1].replies, route, ...events)
        if (inserted) {
          thread[0].latest_created_at = thread[thread.length - 1].replies.reduce((acc, curr) =>
            Math.max(acc, curr[0].latest_created_at), thread[thread.length - 1].latest_created_at)
          return true
        }
      }
    }
  }
  if (unshiftThreads.length) return true
  else return false
}

export function addToThread(threads, event, route = '', reorder) {
  // if (Array.isArray(event)) {
  //   console.log('addToThread using array as event', event)
  //   if (event[event.length - 1].replies?.length) event[0].latest_created_at = event[event.length - 1].replies.reduce((acc, curr) =>
  //     Math.max(acc, curr[0].latest_created_at), event[event.length - 1].latest_created_at)
  //   else event[0].latest_created_at = event[event.length - 1].latest_created_at
  //   if (searchAndUpdateThreads(threads, route, event)) return
  //   addSorted(threads, event, (a, b) => a[0].latest_created_at < b[0].latest_created_at)
  //   // addSorted(threads, event, (a, b) => a[a.length - 1].created_at < b[b.length - 1].created_at)
  //   return
  // }
  event.replies = []
  event.latest_created_at = event.created_at
  if (searchAndUpdateThreads(threads, route, event)) {
    if (reorder) threads.sort((a, b) => Number(b[0].latest_created_at) - Number(a[0].latest_created_at))
  } else addSorted(threads, [event], (a, b) => a[0].latest_created_at < b[0].latest_created_at)
}
