const channel = location.pathname.slice(1) || 'public'
const apiUrl = `wss://${location.host}/_api/`
const pieceClass = 'js-piece'
const pieces = document.querySelectorAll(`.${pieceClass}`);

const ws = new WebSocket(apiUrl)

let highestZ = 0
let dragged = false
let dragging = false
let held = false
let element = null
let wsConnected = false
const radius = 40
const positions = {}

const overlay = document.getElementById('overlay')

function enable () {
  overlay.style.display = 'none'
}

function disable () {
  overlay.style.display = 'block'
}

ws.addEventListener('open', () => {
  wsConnected = true
  ws.send(JSON.stringify(['channel', channel]))
  enable()
})

ws.addEventListener('close', disable)

const handlers = {
  positions ({positions}) {
    Object.entries(positions).forEach(([id, position]) => {
      move(document.getElementById(id), position)
    })
  },
  position ({position}) {
    update(position)
  },
  noemi () {
    toggleHomo('no homo')
  }
}

ws.addEventListener('message', ({data}) => {
  const message = JSON.parse(data)
  const handler = handlers[message.type]
  handler && handler(message)
})

function upload (positions) {
  ws.send(JSON.stringify(['position', ...positions]))
}

function getCoordsFromEvent ({pageX, pageY, touches}) {
  if (touches) {
    const {
      pageX,
      pageY
    } = touches[0]

    return {
      x: pageX - radius,
      y: pageY - radius
    }
  }
  return {
    x: pageX - radius,
    y: pageY - radius
  }
}

function move (element, {x, y, z}) {
  element.style.position = 'absolute'
  element.style.left = `${x}px`
  element.style.top = `${y}px`
  element.style.zIndex = z
  if (z > highestZ) highestZ = z
}

function moveAndSet ({x, y}) {
  const position = {
    x,
    y,
    z: element.style.zIndex
  }
  move(element, position)
  positions[element.id] = position
}

function update ([id, x, y, z]) {
  positions[id] = {x, y, z}
  pieces.forEach(piece => {
    position = positions[piece.id]
    position && move(piece, position)
  })
}

const starting = {}

const handleDown = event => {
  if (!event.target.classList.contains(pieceClass)) return

  element = event.target
  dragging = true
  element.style.position = 'absolute'


  const {
    x,
    y
  } = getCoordsFromEvent(event)

  starting.x = x
  starting.y = y

  moveAndSet({x, y})
  element.style.zIndex = highestZ++
}

const handleMove = event => {
  if (!dragging || !element) return

  moveAndSet(getCoordsFromEvent(event))
}

function getDistance ({x: x1, y: y1}, {x: x2, y: y2}) {
  if (x1 == null || x2 == null || y1 == null || y2 == null) return {}
  const smallX = Math.min(x1, x2)
  const largeX = Math.max(x1, x2)
  const smallY = Math.min(y1, y2)
  const largeY = Math.max(y1, y2)

  return {
    x: largeX - smallX,
    y: largeY - smallY
  }
}

const handleUp = event => {
  if (held) return
  const {id} = element
  const {x, y, z} = positions[id]

  const {x: distanceX, y: distanceY} = getDistance({x, y}, starting)

  if (distanceX != null && distanceY != null) {
    if (distanceX > radius / 2 || distanceY > radius / 2) {
      dragged = true
    }
  }

  dragging = false
  element = null
  upload([id, x, y, z])
  starting.x = null
  starting.y = null
  starting.z = null
}

const handleClick = event => {
  if (dragged) {
    dragged = false
    return
  }

  if (element && held) {
    element.style.position = 'absolute'

    moveAndSet(getCoordsFromEvent(event))
    element.style.zIndex = highestZ++
    element.classList.remove('held')
    element = null
    held = false
    return
  }

  if (held) return
  if (!event.target) return
  if (!event.target.classList.contains(pieceClass)) return

  dragging = false
  held = true

  element = event.target

  element.classList.add('held')
}

document.body.addEventListener('mousedown', handleDown)
document.body.addEventListener('mousemove', handleMove)
document.body.addEventListener('mouseup', handleUp)

document.body.addEventListener('touchstart', handleDown)
document.body.addEventListener('touchmove', handleMove)
document.body.addEventListener('touchend', handleUp)

document.body.addEventListener('click', handleClick)

function createTyper (word, fn) {
  let typed = []
  window.addEventListener('keydown', event => {
    typed.push(event.key)
    typed = typed.slice(-word.length)
    if (typed.join('') === word) fn()
  })
}

function toggleHomo (nohomo) {
  document.body.classList.toggle('gay')
  nohomo || ws.send('["noemi"]')
}

createTyper('gay', toggleHomo)
createTyper('noemi', toggleHomo)
