const channel = location.pathname.slice(1) || 'public'
const apiUrl = `wss://${location.host}/_api/`
const pieceClass = 'js-piece'
const pieces = document.querySelectorAll(`.${pieceClass}`);

const ws = new WebSocket(apiUrl)

let highestZ = 0
let dragging = false
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

function getCoordsFromEvent ({clientX, clientY}) {
  return {
    x: clientX - radius,
    y: clientY - radius
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

document.body.addEventListener('pointerdown', event => {
  if (!event.target.classList.contains(pieceClass)) return

  element = event.target
  dragging = true
  element.style.position = 'absolute'

  moveAndSet(getCoordsFromEvent(event))
  element.style.zIndex = highestZ++
})

document.body.addEventListener('pointermove', event => {
  if (!dragging || !element) return

  moveAndSet(getCoordsFromEvent(event))
})

document.body.addEventListener('pointerup', event => {
  const {id} = element
  const {x, y, z} = positions[id]
  dragging = false
  element = null
  upload([id, x, y, z])
})

function createTyper (word, fn) {
  let typed = []
  window.addEventListener('keydown', event => {
    typed.push(event.key)
    typed = typed.splice(-word.length)
    if (typed.join('') === word) fn()
  })
}

const toggleHomo = () => document.body.classList.toggle('gay')

createTyper('gay', toggleHomo)
createTyper('noemi', toggleHomo)
