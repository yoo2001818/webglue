#version 100

#define AMBIENT_LIGHT_SIZE 1
#define DIRECTIONAL_LIGHT_SIZE 2
#define POINT_LIGHT_SIZE 8
#define SPOT_LIGHT_SIZE 2

// Shader preprocessor should set this data if required.
/*
#define USE_SPECULAR_MAP
#define USE_DIFFUSE_MAP
#define USE_EMISSION_MAP
#define USE_NORMAL_MAP
#define USE_HEIGHT_MAP
*/

struct Material {
  lowp vec3 ambient;
  lowp vec3 diffuse;
  lowp vec3 specular;

  lowp float shininess;
};

struct MaterialColor {
  lowp vec3 ambient;
  lowp vec3 diffuse;
  lowp vec3 specular;
};

struct AmbientLight {
  lowp vec3 color;
  lowp float intensity;
};

struct DirectionalLight {
  lowp vec3 direction;

  lowp vec3 color;
  lowp vec4 intensity;
};

struct PointLight {
  lowp vec3 position;

  lowp vec3 color;
  lowp vec4 intensity;
};

struct SpotLight {
  lowp vec3 position;
  lowp vec3 direction;

  lowp vec3 color;
  lowp vec4 intensity;
  lowp vec2 angle;
};

// ANGLE does not support textures in a struct, so we need to pull the textures
// out. (If we don't, shader won't work on Chrome on Windows)
#ifdef USE_SPECULAR_MAP
  uniform sampler2D uSpecularMap;
#endif
#ifdef USE_DIFFUSE_MAP
  uniform sampler2D uDiffuseMap;
#endif
#ifdef USE_EMISSION_MAP
  uniform sampler2D uEmissionMap;
#endif
// Normal map and height map is not implemented yet!

uniform Material uMaterial;
uniform AmbientLight uAmbientLight[AMBIENT_LIGHT_SIZE];
uniform DirectionalLight uDirectionalLight[DIRECTIONAL_LIGHT_SIZE];
uniform PointLight uPointLight[POINT_LIGHT_SIZE];
uniform SpotLight uSpotLight[SPOT_LIGHT_SIZE];

uniform ivec4 uLightSize;

uniform lowp vec3 uViewPos;

varying lowp vec2 vTexCoord;
varying lowp vec3 vFragPos;
varying lowp vec3 vNormal;

lowp vec3 calcAmbient(AmbientLight light, MaterialColor matColor) {
  return light.color * light.intensity * matColor.ambient;
}

lowp vec3 calcDirectional(DirectionalLight light, MaterialColor matColor,
  lowp vec3 viewDir
) {
  lowp vec3 lightDir = light.direction;

  // Diffuse
  lowp float lambertian = max(dot(lightDir, vNormal), 0.0);

  // Specular
  lowp float spec = 0.0;
  if (lambertian > 0.0) {
    lowp vec3 halfDir = normalize(lightDir + viewDir);
    lowp float specAngle = max(dot(halfDir, vNormal), 0.0);

    spec = pow(specAngle, uMaterial.shininess);
  }

  // Combine everything together
  lowp vec3 result = matColor.diffuse * light.intensity.g * lambertian;
  result += matColor.specular * light.intensity.b * spec;
  result += matColor.ambient * light.intensity.r;
  result *= light.color;

  return result;
}

lowp vec3 calcPoint(PointLight light, MaterialColor matColor, lowp vec3 viewDir) {
  lowp vec3 lightDir = light.position - vFragPos;

  lowp float distance = length(lightDir);
  lightDir = lightDir / distance;

  // Attenuation
  lowp float attenuation = 1.0 / ( 1.0 +
    light.intensity.w * (distance * distance));

  // Diffuse
  lowp float lambertian = max(dot(lightDir, vNormal), 0.0);

  // Specular
  lowp float spec = 0.0;
  if (lambertian > 0.0) {
    lowp vec3 halfDir = normalize(lightDir + viewDir);
    lowp float specAngle = max(dot(halfDir, vNormal), 0.0);

    spec = pow(specAngle, uMaterial.shininess);
  }

  // Combine everything together
  lowp vec3 result = matColor.diffuse * light.intensity.g * lambertian;
  result += matColor.specular * light.intensity.b * spec;
  result += matColor.ambient * light.intensity.r;
  result *= attenuation;
  result *= light.color;

  return result;
}

lowp vec3 calcSpot(SpotLight light, MaterialColor matColor, lowp vec3 viewDir) {
  lowp vec3 lightDir = light.position - vFragPos;

  lowp float distance = length(lightDir);
  lightDir = lightDir / distance;

  // Attenuation
  lowp float attenuation = 1.0 / ( 1.0 +
    light.intensity.w * (distance * distance));

  // Diffuse
  lowp float lambertian = max(dot(lightDir, vNormal), 0.0);

  // Specular
  lowp float spec = 0.0;
  if (lambertian > 0.0) {
    lowp vec3 halfDir = normalize(lightDir + viewDir);
    lowp float specAngle = max(dot(halfDir, vNormal), 0.0);

    spec = pow(specAngle, uMaterial.shininess);
  }

  // Spotlight
  lowp float intensity = 1.0;
  lowp float theta = dot(lightDir, light.direction);
  lowp float epsilon = light.angle.x - light.angle.y;
  intensity = clamp((theta - light.angle.y) / epsilon,
    0.0, 1.0);

  // Combine everything together
  lowp vec3 result = matColor.diffuse * light.intensity.g * lambertian;
  result += matColor.specular * light.intensity.b * spec;
  result *= intensity;
  result += matColor.ambient * light.intensity.r;
  result *= attenuation;
  result *= light.color;

  return result;

}

void main(void) {
  lowp vec3 viewDir = normalize(uViewPos - vFragPos);

  MaterialColor matColor;
  matColor.ambient = uMaterial.ambient;
  matColor.diffuse = uMaterial.diffuse;
  matColor.specular = uMaterial.specular;

  #ifdef USE_DIFFUSE_MAP
    lowp vec4 diffuseTex = texture2D(uDiffuseMap, vTexCoord);
    matColor.ambient *= diffuseTex.xyz;
    matColor.diffuse *= diffuseTex.xyz;
  #endif

  #ifdef USE_SPECULAR_MAP
    lowp vec4 specularTex = texture2D(uSpecularMap, vTexCoord);
    matColor.specular *= specularTex.xyz;
  #endif

  lowp vec3 result = vec3(0.0, 0.0, 0.0);
  for (int i = 0; i < AMBIENT_LIGHT_SIZE; ++i) {
    if (i >= uLightSize.x) break;
    result += calcAmbient(uAmbientLight[i], matColor);
  }
  for (int i = 0; i < DIRECTIONAL_LIGHT_SIZE; ++i) {
    if (i >= uLightSize.y) break;
    result += calcDirectional(uDirectionalLight[i], matColor, viewDir);
  }
  for (int i = 0; i < POINT_LIGHT_SIZE; ++i) {
    if (i >= uLightSize.z) break;
    result += calcPoint(uPointLight[i], matColor, viewDir);
  }
  for (int i = 0; i < SPOT_LIGHT_SIZE; ++i) {
    if (i >= uLightSize.w) break;
    result += calcSpot(uSpotLight[i], matColor, viewDir);
  }

  #ifdef USE_EMISSION_MAP
    lowp vec4 emissionTex = texture2D(uEmissionMap, vTexCoord);
    result += emissionTex.xyz;
  #endif

  gl_FragColor = vec4(result, 1.0);
}
