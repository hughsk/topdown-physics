var blockSize = 40
var canvas = document.createElement('canvas')
var topdown = require('./')

/**
 * Setup
 */
var raf = require('raf')
var vkey = require('vkey')
var zeros = require('zeros')
var aabb = require('aabb-2d')
var levelup = require('levelup')
var debounce = require('debounce')
var cave = require('cave-automata-2d')

var db = levelup('topdown-demo', {
  db: require('level-js')
})

var field = require('ndarray-continuous')({
  shape: [32, 32],
  getter: function(pos, done) {
    var array = zeros(this.shape)
    return done(null, cave(array)(10))
  }
}).on('remove', function(chunk) {
  storage.save(chunk)
})

var storage = require('continuous-storage')(db, field, {
  index: function(position) {
    return 'chunk:' + position.join(':')
  }
})

var pointer = require('pointer-trap')(canvas)
var moveTo = require('continuous-observer')(field, 1)
var player = aabb([0, 0], [1, 1])

var bullets = []
var physics = topdown(player, field, {
    friction: 0.1
  , interval: 1 / blockSize
  , physical: function(n) { return !n }
})

// Don't call save until 1000ms after the last
// save call has finished - stops overloading the
// database, but still giving near-instant saves.
storage.saveall = debounce(storage.saveall, 1000, false)

/**
 * Input
 */
var moving = [0, 0]
function keydown(key) {
  switch (key) {
    case 'W': case '<up>':    moving[1] = -0.025; break
    case 'S': case '<down>':  moving[1] = +0.025; break
    case 'A': case '<left>':  moving[0] = -0.025; break
    case 'D': case '<right>': moving[0] = +0.025; break
  }
}
function keyup(key) {
  switch (key) {
    case 'W': case '<up>':    moving[1] = 0; break
    case 'S': case '<down>':  moving[1] = 0; break
    case 'A': case '<left>':  moving[0] = 0; break
    case 'D': case '<right>': moving[0] = 0; break
  }
}

function fire(e) {
  var create = e && e.which === 3
  var bb = aabb([
      (physics.min[0] + physics.max[0]) / 2 - 0.125
    , (physics.min[1] + physics.max[1]) / 2 - 0.125
  ], [0.25, 0.25])
  var bullet = topdown(bb, field, {
      friction: 0
    , interval: 4 / blockSize
    , physical: function(n) { return !n }
  })

  var angle = Math.atan2((pointer.pos.y-canvas.height/2), (pointer.pos.x-canvas.width/2))
  bullet.spd[0] = Math.cos(angle) * 0.5
  bullet.spd[1] = Math.sin(angle) * 0.5

  bullet.on('collision', function() {
    var idx = bullets.indexOf(bullet)
    if (idx === -1) return
    bullets.splice(idx, 1)
    if (create) {
      field.set([Math.floor(bullet.min[0]), Math.floor(bullet.min[1])], 0)
    } else {
      field.set([Math.floor(bullet.min[0] + bullet.spd[0]), Math.floor(bullet.min[1] + bullet.spd[1])], 1)
    }

    // Save changes to the database
    storage.saveall()
  })

  bullets.push(bullet)
}

document.body.addEventListener('keydown', function(e) {
  keydown(vkey[e.keyCode])
}, false)
document.body.addEventListener('keyup', function(e) {
  keyup(vkey[e.keyCode])
}, false)

canvas.addEventListener('click', fire)

/**
 * Game loop
 */
raf(canvas).on('data', function() {
  physics.spd[0] += moving[0]
  physics.spd[1] += moving[1]
  tick()
  draw()
})

var ctx = canvas.getContext('2d')
var block = blockSprite()
var n = 0

function tick() {
  physics.tick()
  var b = bullets.length
  while (b--) bullets[b].tick()
  if (!(n++ % 10)) moveTo(player.base)
}

function draw() {
  var width = canvas.width = window.innerWidth
  var height = canvas.height = window.innerHeight

  var b = bullets.length
  while (b--) ctx.fillRect(
      (bullets[b].min[0] - player.base[0]) * blockSize + width / 2
    , (bullets[b].min[1] - player.base[1]) * blockSize + height / 2
    , 8
    , 8
  )

  field.each(function(chunk) {
    var shape = chunk.shape
      , offset = chunk.position.slice()
      , X, Y

    var d = shape.length
    while (d--) offset[d] *= shape[d]

    // draw the player
    ctx.fillStyle = '#85CAE8'
    ctx.fillRect(width / 2 + 2, height / 2 + 2, blockSize - 4, blockSize - 4)
    ctx.fillStyle = '#444'

    // draw the grid
    for (var y = 0; y < shape[1]; y += 1)
    for (var x = 0; x < shape[0]; x += 1) {
      X = Math.floor((offset[0] + x - player.base[0]) * blockSize + width/2)
      Y = Math.floor((offset[1] + y - player.base[1]) * blockSize + height/2)

      if (
        // exclude everything offscreen
        X >= -blockSize && Y >= -blockSize &&
        X <= width &&
        Y <= height &&
        // only draw "0"s, which are solid
        // tiles in this case
        !chunk.get(x, y)
      ) ctx.drawImage(block, X, Y)
    }

    ctx.fillStyle = pointer.trapped ? '#0f0' : '#f00'
    ctx.fillRect(pointer.pos.x - 4, pointer.pos.y - 4, 8, 8)
  })
}

// Caching something even as simple as a
// fillRect call makes for a nice performance
// improvement.
function blockSprite() {
  var el = document.createElement('canvas')
    , ctx = el.getContext('2d')

  ctx.width =
  ctx.height = blockSize
  ctx.fillStyle = '#444'
  ctx.fillRect(2, 2, blockSize - 4, blockSize - 4)

  return el
}

/**
 * DOM Setup
 */
document.body.style.margin = 0
document.body.style.padding = 0
document.body.style.overflow = 'hidden'
canvas.width = window.innerWidth
canvas.height = window.innerHeight
document.body.appendChild(canvas)
