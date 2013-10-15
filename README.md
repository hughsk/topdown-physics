# topdown-physics [![experimental](https://rawgithub.com/hughsk/stability-badges/master/dist/experimental.svg)](http://github.com/hughsk/stability-badges) #

Basic, grid-based, 2D top-down player physics for
[continuous ndarrays](http://github.com/hughsk/ndarray-continuous).

You can find a demo [here](http://hughsk.github.io/topdown-physics),
the code for which is
[here](https://github.com/hughsk/topdown-physics/blob/master/demo.js).

The implementation could be improved a lot - patches welcome :)

## Installation ##

Written to be used with [browserify](http://browserify.org/).

``` bash
npm install topdown-physics
```

## Usage ##

### `physics = require('topdown-physics')(player, field[, options])` ###

`player` is an axis-aligned bounding box - use
[`aabb-2d`](http://npmjs.org/package/aabb-2d) for this. `field` is a
continuous ndarray to check collisions against. You can also pass the
following options:

* `friction`: The amount of friction to apply - the higher the value, the
  more quickly the player will slow down.
* `physical`: A function that should the value of a cell and returns whether
  or not it is solid, i.e. the player cannot move through it. Alternatively,
  you can just pass in a constant value. Defaults to 0.
* `interval`: The granularity of collision checks - generally, this is best
  set to the reciprocal of the width in pixels of each cell when rendered.
  So if each block is 32x32, you should set this to `1 / 32`.

### `physics.tick()` ###

Steps forward the simulation by one tick - this should be called each frame.

### `physics.spd` ###

An array you're free to modify directly. The first value is the horizontal
speed (in cells per tick), and the second is the vertical speed.

### `physics.on('collision', callback)` ###

Emitted when a collision is made during a tick.
