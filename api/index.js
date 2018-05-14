const {Server} = require('ws')

const wss = new Server({port: 3714})

const channels = {}
const channelUsers = {}

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
      channelUsers[channel].forEach(user => {
        user.send(JSON.stringify({
          type: 'position',
          position: [id, x, y, z]
        }))
      })
    }
  }

  ws.on('message', message => {
    const [type, ...data] = JSON.parse(message)
    handlers[type](...data)
  })
})
