var floor = Math.floor
  , abs = Math.abs
  , min = Math.min

module.exports = Topdown

function Topdown(player, field, options) {
  if (!(this instanceof Topdown)) return new Topdown(player, field, options)

  if (!player) throw new Error('You must pass an AABB as the first argument')
  if (!field) throw new Error('You must pass a continuous ndarray as the second argument')
  options = options || {}

  this.player = player

  this.min = player.base
  this.max = player.max
  this.spd = [0, 0]

  this.field = field
  this.friction = 1 - (options.friction || 0.1)
  this.interval = options.interval || (1 / 32)
  this.physical = options.physical
    ? functor(options.physical)
    : identity
}

var tempSpeed = []
var tempPos = [0,0]
Topdown.prototype.tick = function() {
  var interval = this.interval
  var physical = this.physical
  var field = this.field
  var friction = this.friction
  var width = this.max[0] - this.min[0]
  var height = this.max[1] - this.min[1]
  var collision = false
  var tl = false
  var tr = false
  var br = false
  var bl = false

  tempSpeed[0] = this.spd[0]
  tempSpeed[1] = this.spd[1]
  tempPos[0] = this.min[0]
  tempPos[1] = this.min[1]

  while (tempSpeed[0] || tempSpeed[1]) {
    var xoff = sign(tempSpeed[0]) * min(interval, abs(tempSpeed[0]))
    var yoff = sign(tempSpeed[1]) * min(interval, abs(tempSpeed[1]))
    tempPos[0] += xoff
    tempPos[1] += yoff
    tempSpeed[0] -= xoff
    tempSpeed[1] -= yoff

    tl = physical(field.get([ floor(tempPos[0]),         floor(tempPos[1]) ]))
    tr = physical(field.get([ floor(tempPos[0] + width), floor(tempPos[1]) ]))
    br = physical(field.get([ floor(tempPos[0] + width), floor(tempPos[1] + height) ]))
    bl = physical(field.get([ floor(tempPos[0]),         floor(tempPos[1] + height) ]))

    // left/right
    if (this.spd[0] < 0) {
      if (tl || bl) tempPos[0] -= xoff
    } else
    if (this.spd[0] > 0) {
      if (tr || br) tempPos[0] -= xoff
    }

    // up/down
    if (this.spd[1] < 0) {
      if (tr || tl) tempPos[1] -= yoff
    } else
    if (this.spd[1] > 0) {
      if (br || bl) tempPos[1] -= yoff
    }
  }

  tempPos[0] -= this.min[0]
  tempPos[1] -= this.min[1]
  this.spd[0] *= friction
  this.spd[1] *= friction
  this.player.translate(tempPos)
}

function functor(fn) {
  if (typeof fn === 'function') return fn
  return function() {
    return fn
  }
}

function identity(x) {
  return x
}

function sign(x) {
  return x > 0 ? 1 : x < 1 ? -1 : 0
}
