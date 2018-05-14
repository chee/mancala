const {OPEN, Server} = require('ws')

const wss = new Server({port: 3714})

const channels = {}
const channelUsers = {}

const tell = (channel, message, current) => {
  channelUsers[channel].forEach(user => {
    if (user.readyState !== OPEN) {
      channelUsers[channel] = channelUsers[channel].filter(user =>
        user.readyState === OPEN
      )
      return
    }
    if (user === current) return
    user.send(JSON.stringify(message))
  })
}

wss.on('connection', (ws, request) => {
  let channel

  const handlers = {
    channel (next) {
      channel = next
      channels[channel] = channels[channel] || {}
      channelUsers[channel] = channelUsers[channel] || []
      channelUsers[channel].push(ws)
      ws.send(JSON.stringify({
        type: 'positions',
        positions: channels[channel]
      }))
    },
    position (id, x, y, z) {
      channels[channel][id] = {x, y, z}
      tell(channel, {
        type: 'position',
        position: [id, x, y, z]
      })
    },
    noemi () {
      tell(channel, {type: 'noemi'}, ws)
    }
  }

  ws.on('message', message => {
    const [type, ...data] = JSON.parse(message)
    const handler = handlers[type]
    handler && handler(...data)
  })
})

