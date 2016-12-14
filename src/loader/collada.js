import sax from 'sax';
import { mat4 } from 'gl-matrix';

class Context {
  constructor() {
    this.stack = [];
    this.namespace = {};
  }
  push(operator, data) {
    let stackFrame = { operator, parent: this.stack[this.stack.length - 1] };
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
      popChild && popChild.call(this, result, parentFrame, stackFrame);
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
  resolveURI(name) {
    if (name.charAt(0) === '#') {
      return this.namespace[name.slice(1)];
    }
    throw new Error('This parser doesn\'t support outside URI (Only XPointer ' +
      'Syntax is supported)');
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
  (schema) => cached(schema, v => v && Object.assign({}, v, {
    // merge is *always* executed by hierarchy, even though no prev object
    // is available.
    merge: (prev = [], current) => (prev.push(current), prev)
  }));
const multipleMap =
  (schema, getKey) => cached(schema, v => v && Object.assign({}, v, {
    // merge is *always* executed by hierarchy, even though no prev object
    // is available.
    merge: (prev = {}, current, frame) => {
      prev[getKey(current, frame)] = current;
      return prev;
    }
  }));
const unwrap = (schema) => cached(schema, v => v && Object.assign({}, v, {
  merge: (prev, current, frame) => {
    Object.assign(frame.parent.data, current);
    return undefined;
  }
}));
const merge =
  (schema, merge) => cached(schema, v => v && Object.assign({ merge }, v));


function createNamespace(createLocal, sidNecessary, overwrite = true) {
  return {
    push(node, frame) {
      const { id, sid, name } = node.attributes;
      if (sid != null) {
        let parent = frame.parent;
        while (parent != null && parent.namespace == null) {
          parent = node.parent;
        }
        if (parent != null) {
          frame.namespaceParent = parent;
          frame.sid = sid;
        }
      } else if (sidNecessary) {
        throw new Error('sid is required but was not specified');
      }
      if (id != null) {
        frame.id = id;
      }
      frame.name = name;
      if (createLocal) {
        frame.namespace = {};
      }
    },
    pop(data, frame) {
      if (frame.namespaceParent != null) {
        frame.namespaceParent.namespace[frame.sid] = data;
        if (overwrite) data.sid = frame.sid;
      }
      if (frame.id != null) {
        this.namespace[frame.id] = data;
        if (overwrite) data.id = frame.id;
      }
      if (overwrite && frame.name != null) data.name = frame.name;
      return data;
    }
  };
}

const registerId = createNamespace(true, false, true);
const registerIdSilent = createNamespace(true, false, false);
const registerSid = createNamespace(false, true, true);
const registerSidOptional = createNamespace(false, false, true);

function addTrigger(schema, triggers) {
  let onPush, onPop;
  if (typeof triggers === 'function') onPush = triggers;
  else if (triggers != null) {
    onPush = triggers.push;
    onPop = triggers.pop;
  }
  return cached(schema, v => {
    return v && Object.assign({}, v, {
      push(node, frame) {
        v.push(node, frame);
        if (onPush != null) onPush.call(this, node, frame);
      },
      pop(data, frame) {
        let result = v.pop(data, frame);
        if (onPop != null) return onPop.call(this, result, frame);
        return result;
      }
    });
  });
}

function hoist(children, triggers, initialValue = undefined) {
  let onPush, onPop;
  if (typeof triggers === 'function') onPush = triggers;
  else if (triggers != null) {
    onPush = triggers.push;
    onPop = triggers.pop;
  }
  return {
    push(node, frame) {
      frame.data = initialValue;
      if (onPush != null) onPush.call(this, node, frame);
    },
    opentag(node, frame) {
      let child = children[node.name];
      // Ignore if node name doesn't match
      if (child == null) return this.push(NOOP, node);
      let schema = resolveSchema(child);
      // TODO Remove this
      if (schema == null) return this.push(NOOP, node);
      frame.targetSchema = schema;
      this.push(schema, node);
    },
    closetag() {
      // TODO This should be default operation if not specified
      this.pop();
    },
    pop(data, frame) {
      if (onPop != null) return onPop.call(this, frame.data, frame);
      return frame.data;
    },
    popChild(data, frame, childFrame) {
      let result = data;
      if (frame.targetSchema && frame.targetSchema.merge != null) {
        result = frame.targetSchema.merge(frame.data, result, childFrame);
      }
      frame.data = result;
    }
  };
}

function hierarchy(children, triggers) {
  let onPush, onPop;
  if (typeof triggers === 'function') onPush = triggers;
  else if (triggers != null) {
    onPush = triggers.push;
    onPop = triggers.pop;
  }
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
      if (onPop != null) return onPop.call(this, frame.data, frame);
      return frame.data;
    },
    popChild(data, frame, childFrame) {
      let prev = frame.data[frame.target];
      let result = data;
      if (frame.target == null) return;
      if (frame.targetSchema && frame.targetSchema.merge != null) {
        result = frame.targetSchema.merge(prev, result, childFrame);
      }
      if (result !== undefined) frame.data[frame.target] = result;
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
      if (schemaResolved == null) return this.push(NOOP, node);
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

function attributes(proc) {
  return {
    push(node, frame) {
      if (proc != null) frame.data = proc(node);
      else frame.data = node.attributes;
    },
    opentag(node) {
      return this.push(NOOP, node);
    },
    closetag() {
      // TODO This should be default operation if not specified
      this.pop();
    },
    pop(data, frame) {
      return frame.data;
    },
    merge(prev = {}, current) {
      if (proc != null) return current;
      return Object.assign(prev, current);
    }
  };
}

function textValue(proc) {
  return {
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
      return proc(frame.value);
    }
  };
}

function matrixOp(op) {
  return rename('matrix', merge(
    addTrigger('floatArray', registerIdSilent), (prev, current) => {
      return mat4.multiply(prev, op(current), prev);
    })
  );
}

const MATERIAL_STRUCTURE = {
  emission: 'colorOrTexture',
  ambient: 'colorOrTexture',
  diffuse: 'colorOrTexture',
  specular: 'colorOrTexture',
  shininess: 'floatOrParam',
  reflective: 'colorOrTexture',
  reflectivity: 'floatOrParam',
  transparent: 'colorOrTexture',
  transparency: 'floatOrParam',
  index_of_refraction: rename('refraction', 'floatOrParam')
};

const CORE_PARAM_TYPE = {
  bool: 'boolean',
  bool2: 'booleanArray',
  bool3: 'booleanArray',
  bool4: 'booleanArray',
  int: 'int',
  int2: 'intArray',
  int3: 'intArray',
  int4: 'intArray',
  float: 'float',
  float2: 'floatArray',
  float3: 'floatArray',
  float4: 'floatArray',
  surface: 'surface',
  sampler2D: 'sampler',
  samplerCUBE: 'sampler'
};

for (let i = 1; i <= 4; ++i) {
  for (let j = 1; j <= 4; ++j) {
    CORE_PARAM_TYPE[`float${i}x${j}`] = 'floatArray';
  }
}

let tmpMat4 = mat4.create();

const SCHEMA = {
  noop: NOOP,
  attributes: attributes(),
  boolean: textValue(v => v === 'true'),
  booleanArray: textValue(v => v.split(/\s+/).map(v => v === 'true')),
  string: textValue(v => v),
  // Should be the date parsed?
  date: textValue(v => v),
  stringArray: textValue(v => v.split(/\s+/)),
  float: textValue(v => parseFloat(v)),
  floatArray: textValue(v => new Float32Array(v.split(/\s+/).map(parseFloat))),
  int: textValue(v => parseFloat(v)),
  intArray: textValue(v => new Int32Array(v.split(/\s+/).map(parseFloat))),
  COLLADA: hierarchy({
    asset: 'asset',
    library_animations: rename('animations', library('animation', 'animation')),
    library_animation_clips: rename('animationClips', library('animation_clip',
      'animationClip')),
    library_cameras: rename('cameras', library('camera', 'camera')),
    library_controllers: rename('controllers', library('controller',
      'controller')),
    library_geometries: rename('geometries', library('geometry', 'geometry')),
    library_lights: rename('lights', library('light', 'light')),
    library_nodes: rename('nodes', library('node', 'node')),
    library_visual_scenes: rename('visualScenes', library('visual_scene',
      'visualScene')),
    // COLLADA FX
    library_images: rename('images', library('image', 'image')),
    library_effects: rename('effects', library('effect', 'effect')),
    library_materials: rename('materials', library('material', 'material'))
  }, ({ attributes }) => {
    // Check version
    if (attributes.version.slice(0, 3) !== '1.4') {
      throw new Error('COLLADA parser only supports 1.4.x format');
    }
  }),
  asset: hierarchy({
    contributor: multiple('contributor'),
    created: 'date',
    modified: 'date',
    keywords: 'stringArray',
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
  }),
  animation: hierarchy({
    animation: rename('children', multiple('animation'))
  }, registerId),
  effect: hierarchy({
    asset: 'asset',
    image: rename('images', multiple('image')),
    // Only accept COMMON profile for now
    profile_COMMON: rename('common', hierarchy({
      asset: 'asset',
      image: rename('images', multiple('image')),
      newparam: rename('params', multipleMap('newparam',
        (data, frame) => frame.sid
      )),
      technique: hoist({
        // TODO Accept image / newparam at this point
        // image: rename('images', multiple('image')),
        // newparam: rename('params', multiple('newparam')),
        blinn: hierarchy(MATERIAL_STRUCTURE,
          (node, frame) => frame.data.type = 'blinn'),
        constant: hierarchy(MATERIAL_STRUCTURE,
          (node, frame) => frame.data.type = 'constant'),
        lambert: hierarchy(MATERIAL_STRUCTURE,
          (node, frame) => frame.data.type = 'lambert'),
        phong: hierarchy(MATERIAL_STRUCTURE,
          (node, frame) => frame.data.type = 'phong')
      }, registerSid)
    }, registerId))
  }, {
    push: registerId.push,
    pop(data, frame) {
      if (frame.data.common) {
        let { common } = frame.data;
        let newImages = (frame.data.images || []).concat(common.images || []);
        Object.assign(frame.data, common);
        frame.data.images = newImages;
        delete frame.data.common;
      }
      return registerId.pop.call(this, frame.data, frame);
    }
  }),
  newparam: hoist(CORE_PARAM_TYPE, registerSid),
  colorOrTexture: hoist({
    color: 'floatArray',
    param: attributes(v => v.attributes.ref),
    // Ignore 'texCoord' for now
    texture: attributes(v => v.attributes.texture)
  }),
  floatOrParam: hoist({
    float: 'float',
    param: attributes(v => v.attributes.ref)
  }),
  surface: hierarchy({
    size: 'floatArray',
    mipmap_generate: 'boolean',
    channels: 'string',
    range: 'string',
    // TODO Cube texture
    init_cube: NOOP,
    init_from: 'string'
  }),
  sampler: hierarchy({
    source: 'string',
    wrap_s: 'fxSamplerWrapCommon',
    wrap_t: 'fxSamplerWrapCommon',
    minfilter: 'fxSamplerFilterCommon',
    magfilter: 'fxSamplerFilterCommon',
    mipfilter: 'fxSamplerFilterCommon'
  }),
  material: hoist({
    instance_effect: 'instanceEffect'
  }, registerId),
  instanceEffect: hierarchy({
    setparam: rename('params', multipleMap(
      hoist(CORE_PARAM_TYPE, (node, frame) => {
        frame.ref = node.attributes.ref;
      }),
      (data, frame) => frame.ref
    ))
  }, {
    push(node, frame) {
      frame.data.effect = node.attributes.url;
    }
  }),
  geometry: hoist({
    mesh: hierarchy({
      source: rename('sources', multipleMap('source',
        (data, frame) => frame.id)),
      vertices: hoist({
        input: multipleMap(attributes(), (data, frame) => frame.data.semantic)
      }, registerIdSilent),
      lines: 'polylist',
      linestrips: 'polylist',
      triangles: 'polylist',
      polylist: 'polylist'
    })
  }, registerId),
  polylist: hierarchy({
    input: multipleMap(attributes(), (data, frame) => frame.data.semantic),
    p: 'intArray',
    vcount: 'intArray'
  }, {
    push: (node, frame) => {
      frame.data.material = node.attributes.material;
      frame.parent.data.type = node.name;
    }
  }),
  source: hierarchy({
    Name_array: rename('data', addTrigger('stringArray', registerIdSilent)),
    bool_array: rename('data', addTrigger('booleanArray', registerIdSilent)),
    float_array: rename('data', addTrigger('floatArray', registerIdSilent)),
    int_array: rename('data', addTrigger('intArray', registerIdSilent)),
    // TODO Read param names
    technique_common: rename('options', hoist({
      accessor: attributes()
    }))
  }, {
    push: registerId.push,
    pop(data, frame) {
      // TODO This should be outside XML parser (Should do post processing)
      if (data.options != null) {
        data.axis = parseInt(data.options.stride) || 1;
        if (data.source != null) {
          data.data = this.resolveURI(data.source, frame);
        }
        let offset = parseInt(data.options.offset);
        if (!isNaN(offset)) {
          // TODO We shouldn't care about data structure size...
          data.offset = offset * 4;
        }
        let count = parseInt(data.options.count);
        if (!isNaN(count)) {
          data.count = count;
          // Slice the array
          if (Array.isArray(data.data)) {
            data.data = data.data.slice(0, count * data.axis);
          } else {
            data.data = data.data.subarray(0, count * data.axis);
          }
        }
      }
      return registerId.pop.call(this, data, frame);
    }
  }),
  visualScene: hierarchy({
    node: rename('children', multiple('node'))
  }, registerId),
  node: hierarchy({
    asset: 'asset',
    node: rename('children', multiple('node')),
    // If we do animation, this might have to be updated often - it shouldn't
    // be coupled with XML parser.
    lookat: matrixOp(input => {
      let eye = input.subarray(0, 3);
      let center = input.subarray(3, 6);
      let up = input.subarray(6, 9);
      return mat4.lookAt(tmpMat4, eye, center, up);
    }),
    matrix: matrixOp(input => {
      return mat4.copy(tmpMat4, input);
    }),
    rotate: matrixOp(input => {
      return mat4.fromRotation(tmpMat4,
        input[3] / 180 * Math.PI, input.subarray(0, 3));
    }),
    scale: matrixOp(input => {
      return mat4.fromScaling(tmpMat4, input);
    }),
    skew: matrixOp(() => {
      throw new Error('Skew operation is not supported');
    }),
    translate: matrixOp(input => {
      return mat4.fromTranslation(tmpMat4, input);
    }),
    instance_geometry: rename('geometries', multiple('instanceGeometry')),
    instance_controller: rename('controllers', multiple('instanceController'))
  }, {
    push(node, frame) {
      registerId.push.call(this, node, frame);
      frame.data.matrix = mat4.create();
      frame.data.type = node.attributes.type || 'NODE';
    },
    pop: registerId.pop
  }),
  instanceGeometry: hoist({
    bind_material: 'bindMaterial'
  }, {
    push(node, frame) {
      registerSidOptional.push.call(this, node, frame);
      frame.data.geometry = node.attributes.url;
    },
    pop: registerSidOptional.pop
  }, {}),
  bindMaterial: hierarchy({
    param: rename('params', multiple(attributes())),
    technique_common: rename('materials', hoist({
      instance_material: multipleMap(hierarchy({}, {
        push(node, frame) {
          registerSidOptional.push.call(this, node, frame);
          frame.data.target = node.attributes.target;
          frame.data.symbol = node.attributes.symbol;
        },
        pop: registerSidOptional.pop
      }), (data, frame) => frame.data.symbol)
    }))
  }),
  instanceController: hierarchy({
    skeleton: 'string',
    bind_material: unwrap('bindMaterial')
  }),
  controller: hoist({
    skin: hierarchy({
      bindShapeMatrix: 'floatArray',
      source: rename('sources', multipleMap('source',
        (data, frame) => frame.id)),
      joints: hoist({
        input: multipleMap(attributes(), (data, frame) => frame.data.semantic)
      }),
      vertex_weights: rename('weights', hierarchy({
        input: rename('inputs', multipleMap(attributes(),
          (data, frame) => frame.data.semantic)),
        vcount: 'intArray',
        v: 'intArray'
      }))
    }, {
      push(node, frame) {
        frame.data.source = node.attributes.source;
      }
    })
  }, registerId)
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
  console.log(context.namespace);
}
