import Shader from '../../shader';
import Material from '../../material';

import Mesh from '../../mesh';
import Container from '../../container';

import LineGeometry from '../geom/line';
import CircleGeometry from '../geom/circle';
import ConeGeometry from '../../geom/coneGeometry';
import BoxGeometry from '../../geom/boxGeometry';
import CombinedGeometry from '../../geom/combinedGeometry';

export default function buildWidget(geom) {
  return new CombinedGeometry([
    geom, geom, geom
  ], [{
    aColor: [1, 0, 0]
  }, {
    aPosition: [
      0, 1, 0, 0,
      0, 0, 1, 0,
      1, 0, 0, 0,
      0, 0, 0, 1
    ],
    aColor: [0, 1, 0]
  }, {
    aPosition: [
      0, 0, 1, 0,
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 1
    ],
    aColor: [0, 0, 1]
  }]);
}

// This will persist on the RAM - It might not be a problem though.

const LINE_GEOM = new LineGeometry();
const CONE_GEOM = new ConeGeometry(10);
const BOX_GEOM = new BoxGeometry();
const CIRCLE_GEOM = new CircleGeometry(24, 0.7);

export const TRANSLATE_AXIS_GEOM = new CombinedGeometry([
  LINE_GEOM, CONE_GEOM
], [{}, {
  aPosition: [
    0, 0, 0.05, 0,
    0.1, 0, 0, 0,
    0, 0.05, 0, 0,
    0.9, 0, 0, 1
  ]
}]);

const TRANSLATE_GEOM = buildWidget(TRANSLATE_AXIS_GEOM);

const SCALE_AXIS_GEOM = new CombinedGeometry([
  LINE_GEOM, BOX_GEOM
], [
  {
    aPosition: [
      0.9, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]
  }, {
    aPosition: [
      0, 0, 0.05, 0,
      0.05, 0, 0, 0,
      0, 0.05, 0, 0,
      0.9, 0, 0, 1
    ]
  }
]);

const SCALE_GEOM = buildWidget(SCALE_AXIS_GEOM);

const ROTATION_AXIS_GEOM = new CombinedGeometry([
  CIRCLE_GEOM
], [{
  aPosition: [
    0, 1, 0, 0,
    0, 0, 1, 0,
    1, 0, 0, 0,
    0, 0, 0, 1
  ]
}]);

const ROTATION_GEOM = buildWidget(ROTATION_AXIS_GEOM);

const SHADER = new Shader(
  require('../shader/widget.vert'), require('../shader/widget.frag')
);
const MATERIAL = new Material(SHADER);

let ROTATION_SHADER = new Shader(
  require('../shader/widgetRotation.vert'),
  require('../shader/widgetRotation.frag')
);
let ROTATION_MATERIAL = new Material(ROTATION_SHADER);

let BILLBOARD_SHADER = new Shader(
  require('../shader/widgetBillboard.vert'),
  require('../shader/widget.frag')
);
let BILLBOARD_MATERIAL = new Material(BILLBOARD_SHADER);
BILLBOARD_MATERIAL.use = () => ({
  uColor: new Float32Array([0, 0, 0])
});

export class TranslateWidget extends Mesh {
  constructor() {
    super(TRANSLATE_GEOM, MATERIAL);
  }
}

export class ScaleWidget extends Mesh {
  constructor() {
    super(SCALE_GEOM, MATERIAL);
  }
}

export class RotationWidget extends Container {
  constructor() {
    super();
    this.appendChild(new Mesh(ROTATION_GEOM, ROTATION_MATERIAL));
    this.appendChild(new Mesh(CIRCLE_GEOM, BILLBOARD_MATERIAL));
  }
}
