# Fields
After rebuilding the webglue's structure, we no longer have global 'update'
sequence, which means that we can't update the matrix and other stuff every
tick, instead we have to update it on demand.

Previously we could just implement 'hasChanged' flag really simply because the
structure only allowed descending, never allowing updating child element alone.

But new structure doesn't have that limitation since internal structure is
completely separated from scene graph. That allows greater flexibility but it
makes the whole thing harder.

For models - we can just set the 'model' matrix in uniform and make draw call.
Lights and cameras are the same too. However, cameras need inverted matrix to
locate the camera in desired location. Furthermore, we have to update the
perspective matrix every time the viewport size changes.

We can simply implement changes using EventListener or Signal system, but it
causes too much overhead, and since both parent and child need pointer to them,
it makes it harder to be garbage collected.

A simpler yet faster solution is using a tick count. Since parents doesn't need
children's data to be updated, parents can be updated without children update.
So, each time the parent gets updated, it should increment its tick count.
Childrens should store last tick count, and every time it needs to be used
it can just simply check if the stored tick count matches with the parent's tick
count. If it matches, we're in luck - we don't need to update it at all. If it
doesn't, we can simply update it and the tick count.

This way, children can be up to date only using 2 integers. Good enough?

Of course, we'd need an interface for implementing fields. A single object
can have multiple fields (obviously), and it should be merged as well.

Maybe it can be implemented using functional programming. Not meaning that
it won't do any mutation - but it can be constructed using functional
programming.

Fields have inputs and outputs. For example, it can accept a matrix and
produce inverted matrix of the input.

Fields would have two kinds of input:

- Another field. they have their own tick count, so we'll have to remember them.
- Their own property. Such as rotation, vector, etc. If the field has one,
  it should have 'valid' property to indicate change.

Fields evaluate when the program requests to do so (lazy evaluation). That
means, it'll start calculation when get() is called.

get() will check if the inputs have been changed, and call validate() when
the check passes. Otherwise, it'll return its output.

validate() will actually calculate the output according to the input,
update the fields, and increment its own tick count.

It'd be better to make it as an interface instead of a class. Sure it won't be
fancy - but that will come later.

```js
let feeder = {
  original: mat4.create(),
  valid: false,
  tickCount: 0,
  getTicks() {
    this.get();
    return this.tickCount;
  }
  get() {
    if (!this.valid) return this.evaluate();
    return this.original;
  },
  validate() {
    this.tickCount ++;
    this.valid = true;
    return this.original;
  }
}
let inverter = {
  original: feeder,
  originalTick: -1,
  output: mat4.create(),
  tickCount: 0,
  get() {
    if (!this.originalTick !== this.original.getTicks()) return this.evaluate();
    return this.output;
  },
  validate() {
    mat4.invert(this.output, this.original);
    this.originalTick = this.original.getTicks();
    return this.output;
  }
}
```

It is kinda messy in this moment, but I'm sure I can improve it...
