import sax from 'sax';

class Context {
  constructor() {
    this.stack = [];
  }
  push(operator, data) {
    let stackFrame = { operator };
    this.stack.push(stackFrame);
    if (operator.push != null) operator.push.call(this, data, stackFrame);
  }
  pop(data) {
    if (this.stack.length === 0) throw new Error('Unable to pop frame');
    let stackFrame = this.stack.pop();
    let popOp = stackFrame.operator.pop;
    let result = popOp && popOp.call(this, data, stackFrame);
    if (this.stack.length > 0) {
      let parentFrame = this.stack[this.stack.length - 1];
      let popChild = parentFrame.operator.popChild;
      popChild && popChild.call(this, result, parentFrame);
    }
  }
  get() {
    return this.stack[this.stack.length - 1];
  }
  getDelegator(getOp) {
    return (v) => {
      let frame = this.get();
      let func = getOp(frame.operator);
      if (func != null) func.call(this, v, frame);
    };
  }
}

const NOOP = {
  opentag(node) {
    this.push(NOOP, node);
  },
  closetag() {
    this.pop();
  },
};

function resolveSchema(schema) {
  if (typeof schema === 'string') return SCHEMA[schema];
  if (typeof schema === 'function') return schema();
  return schema;
}

function cached(schema, manipulator) {
  // We use cache to make hoisting available.... what?
  let cached = null;
  return () => {
    if (cached !== null) return cached;
    cached = manipulator(resolveSchema(schema));
    return cached;
  };
}

const rename =
  (target, schema) => cached(schema, v => v && Object.assign({ target }, v));
const multiple =
  (schema) => cached(schema, v => v && Object.assign({
    // merge is *always* executed by hierarchy, even though no prev object
    // is available.
    merge: (prev = [], current) => (prev.push(current), prev)
  }, v));

function hierarchy(children, onPush) {
  return {
    push(node, frame) {
      // TODO attributes
      frame.data = {};
      if (onPush != null) onPush.call(this, node, frame);
    },
    opentag(node, frame) {
      let child = children[node.name];
      frame.target = null;
      // Ignore if node name doesn't match
      if (child == null) return this.push(NOOP, node);
      let schema = resolveSchema(child);
      // TODO Remove this
      if (schema == null) return this.push(NOOP, node);
      frame.target = schema.target || node.name;
      frame.targetSchema = schema;
      this.push(schema, node);
    },
    closetag() {
      // TODO This should be default operation if not specified
      this.pop();
    },
    pop(data, frame) {
      console.log(frame.data);
      return frame.data;
    },
    popChild(data, frame) {
      let prev = frame.data[frame.target];
      let result = data;
      if (frame.target == null) return;
      if (frame.targetSchema && frame.targetSchema.merge != null) {
        result = frame.targetSchema.merge(prev, result);
      }
      frame.data[frame.target] = result;
    }
  };
}

function library(nodeName, schema) {
  return {
    push(node, frame) {
      frame.data = [];
    },
    opentag(node) {
      // TODO Maybe we should handle this?
      if (nodeName !== node.name) return this.push(NOOP, node);
      let schemaResolved = resolveSchema(schema);
      this.push(schemaResolved, node);
    },
    closetag() {
      // TODO This should be default operation if not specified
      this.pop();
    },
    pop(data, frame) {
      return frame.data;
    },
    popChild(data, frame) {
      if (data == null) return;
      frame.data.push(data);
    },
    merge(prev = [], current) {
      return prev.concat(current);
    }
  };
}

// TODO Stored for future references; should be removed
function jsonify() {
  return {
    push: function (data, frame) {
      frame.data = data;
    },
    opentag: function ({name, attributes}, frame) {
      frame.target = name;
      let data = frame.data[name] = attributes;
      this.push(jsonify(), data);
    },
    text: function (data, frame) {
      let value = data.trim();
      if (value === '') return;
      frame.value = value;
    },
    closetag: function (data, frame) {
      console.log(frame);
      this.pop();
    },
    pop: function (data, frame) {
      if (Object.keys(frame.data).length === 0) return frame.value;
      frame.data.value = frame.value;
      return frame.data;
    },
    popChild: function (data, frame) {
      let prev = frame.data[frame.target];
      if (prev != null) {
        if (Array.isArray(prev)) {
          prev.push(data);
        } else {
          frame.data[frame.target] = [prev, data];
        }
      } else {
        frame.data[frame.target] = data;
      }
    }
  };
}

const RAW_TEXT = {
  push(data, frame) {
    frame.value = null;
  },
  opentag(node) {
    return this.push(NOOP, node);
  },
  closetag() {
    // TODO This should be default operation if not specified
    this.pop();
  },
  text(data, frame) {
    let value = data.trim();
    if (value === '') return;
    frame.value = value;
  },
  pop(data, frame) {
    return frame.value;
  }
};

const SCHEMA = {
  COLLADA: hierarchy({
    asset: 'asset',
    library_animations: library('animations'),
    library_animation_clips: library('animationClips'),
  }, ({ attributes }) => {
    // Check version
    if (attributes.version.slice(0, 3) !== '1.4') {
      throw new Error('COLLADA parser only supports 1.4.x format');
    }
  }),
  noop: NOOP,
  string: RAW_TEXT,
  date: RAW_TEXT,
  stringList: RAW_TEXT,
  asset: hierarchy({
    contributor: multiple('contributor'),
    created: 'date',
    modified: 'date',
    keywords: 'stringList',
    revision: 'string',
    subject: 'string',
    title: 'string',
    unit: 'attributes',
    up_axis: rename('upAxis', 'string')
  }),
  contributor: hierarchy({
    author: 'string',
    authoring_tool: 'string',
    comments: 'string',
    copyright: 'string',
    source_data: rename('sourceData', 'string')
  })
};

const INITIAL = {
  opentag: function (node) {
    if (node.name !== 'COLLADA') {
      throw new Error('Provided file is not COLLADA format');
    }
    this.push(SCHEMA.COLLADA, node);
  }
};

export default function loadCollada(data) {
  let context = new Context();
  context.push(INITIAL);
  let parser = sax.parser(true);
  parser.onerror = (e) => console.log(e);
  parser.ontext = context.getDelegator(v => v.text);
  parser.onopentag = context.getDelegator(v => v.opentag);
  parser.onclosetag = context.getDelegator(v => v.closetag);
  parser.onattribute = context.getDelegator(v => v.attribute);
  parser.onend = context.getDelegator(v => v.end);
  parser.write(data).close();
}
