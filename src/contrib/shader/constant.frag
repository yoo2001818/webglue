#version 100

// Shader preprocessor should set this data if required.
/*
#define USE_DIFFUSE_MAP
*/

struct Material {
  lowp vec3 diffuse;
};

#ifdef USE_DIFFUSE_MAP
  uniform sampler2D uDiffuseMap;
#endif

uniform Material uMaterial;

varying lowp vec2 vTexCoord;

void main(void) {
  lowp vec3 color = uMaterial.diffuse;
  #ifdef USE_DIFFUSE_MAP
    color *= texture2D(uDiffuseMap, vTexCoord).xyz;
  #endif
  gl_FragColor = vec4(color, 1.0);
}
