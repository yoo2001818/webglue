# Light
There are many types of lights we need to support.

## Ambient Light
Ambient lights are global light that affects every object in the scene. They
don't have a position - it's global. Because of this, ambient lights have
only one value - color.

- color: vec3

## Directional Light
Directional lights don't have position either, however they use angle to
calculate diffuse and specular.

- direction: vec3
- color: vec3
- intensity: vec4

## Point light
Point lights have position, but they don't have direction. They have
attenuation due to the position.

- position: vec3
- color: vec3
- intensity: vec4

## Spot light
Spot lights have position and direction, and they use angle minimum / maximum
to make cone shape.

- direction: vec3
- position: vec3
- color: vec3
- intensity: vec4
- angle: vec2
