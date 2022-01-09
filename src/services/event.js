import {dbGetHomeFeedNotes, dbGetEvent} from '../db'

export async function GetHomeFeed(
  limit = 50,
  since = Math.round(Date.now() / 1000)
) {
  const flatList = await dbGetHomeFeedNotes(limit, since)
  return toEventTree(flatList)
}

export async function GetEvents(id) {
  return await dbGetEvent(id)
}

export function toEventTree(flatList) {
  //Nest replies, result like this:
  //Event     !isReply
  //  Event   isReply
  //  Event   isReply
  //Event     !isReply
  var map = {},
    node,
    roots = [],
    i

  for (i = 0; i < flatList.length; i += 1) {
    map[flatList[i].id] = i //Initialize the map
    flatList[i].replies = [] //Initialize the children
  }

  for (i = 0; i < flatList.length; i += 1) {
    node = flatList[i]
    const parents = node.tags.filter(t => t[0] === 'e')
    node.isReply = !!parents.length
    node.isReplyToReply = parents.length > 1
    let parent
    if (node.isReply) {
      node.root = parents[0][1]
      parent = parents.pop()
      if (!flatList[map[parent[1]]]) {
        return []
      }
      flatList[map[parent[1]]].replies.push(node)
      flatList[map[parent[1]]].replies.sort(
        (a, b) => a.created_at - b.created_at
      )
    } else {
      roots.push(node)
    }
  }
  return roots
}
