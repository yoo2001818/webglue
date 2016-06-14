#version 100

precision lowp float;

#define AMBIENT_LIGHT_SIZE 0
#define DIRECTIONAL_LIGHT_SIZE 1
#define POINT_LIGHT_SIZE 1
#define POINT_SHADOW_LIGHT_SIZE 1
#define SPOT_LIGHT_SIZE 0

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

struct PointShadowLight {
  lowp vec3 position;

  lowp vec3 color;
  lowp vec4 intensity;

  lowp mat4 shadowMatrix;
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
#ifdef USE_NORMAL_MAP
  uniform sampler2D uNormalMap;
#endif
#ifdef USE_HEIGHT_MAP
  uniform sampler2D uHeightMap;
  uniform lowp vec2 uHeightMapScale;
#endif
#if defined(USE_NORMAL_MAP) || defined(USE_HEIGHT_MAP)
  #define USE_TANGENT_SPACE
#endif

uniform Material uMaterial;
#if AMBIENT_LIGHT_SIZE > 0
  uniform AmbientLight uAmbientLight[AMBIENT_LIGHT_SIZE];
#endif
#if DIRECTIONAL_LIGHT_SIZE > 0
  uniform DirectionalLight uDirectionalLight[DIRECTIONAL_LIGHT_SIZE];
#endif
#if POINT_LIGHT_SIZE > 0
  uniform PointLight uPointLight[POINT_LIGHT_SIZE];
#endif
#if SPOT_LIGHT_SIZE > 0
  uniform SpotLight uSpotLight[SPOT_LIGHT_SIZE];
#endif
#if POINT_SHADOW_LIGHT_SIZE > 0
  uniform PointShadowLight uPointShadowLight[POINT_SHADOW_LIGHT_SIZE];
  // This is a workaround for Chrome on Windows (ANGLE), since ANGLE doesn't
  // support samplers in a struct.
  uniform sampler2D uPointShadowLightShadowMap[POINT_SHADOW_LIGHT_SIZE];
  // Cache light position to varying to improve performance.
  varying lowp vec4 vPointShadowLightPos[POINT_SHADOW_LIGHT_SIZE];
#endif

uniform ivec4 uLightSize[2];

uniform lowp vec3 uViewPos;

varying lowp vec2 vTexCoord;
varying lowp vec3 vPosition;
#ifdef USE_TANGENT_SPACE
  varying lowp mat3 vTangent;
  varying lowp vec3 vTangentViewPos;
  varying lowp vec3 vTangentFragPos;
#else
  varying lowp vec3 vFragPos;
  varying lowp vec3 vNormal;
#endif

lowp vec3 calcAmbient(AmbientLight light, MaterialColor matColor) {
  return light.color * light.intensity * matColor.ambient;
}

// It's Blinn-Phong actually.
lowp vec2 calcPhong(lowp vec3 lightDir, lowp vec3 viewDir, lowp vec3 normal) {
  // Diffuse
  lowp float lambertian = max(dot(lightDir, normal), 0.0);

  // Specular
  lowp float spec = 0.0;
  if (lambertian > 0.0) {
    lowp vec3 halfDir = normalize(lightDir + viewDir);
    lowp float specAngle = max(dot(halfDir, normal), 0.0);

    spec = pow(specAngle, uMaterial.shininess);
  }

  return vec2(lambertian, spec);
}

lowp vec3 calcDirectional(DirectionalLight light, MaterialColor matColor,
  lowp vec3 viewDir, lowp vec3 normal
) {
  #ifdef USE_TANGENT_SPACE
    lowp vec3 lightDir = vTangent * light.direction;
  #else
    lowp vec3 lightDir = light.direction;
  #endif

  lowp vec2 phong = calcPhong(lightDir, viewDir, normal);

  // Combine everything together
  lowp vec3 result = matColor.diffuse * light.intensity.g * phong.x;
  result += matColor.specular * light.intensity.b * phong.y;
  result += matColor.ambient * light.intensity.r;
  result *= light.color;

  return result;
}

lowp vec3 calcPoint(PointLight light, MaterialColor matColor, lowp vec3 viewDir,
  lowp vec3 normal
) {
  #ifdef USE_TANGENT_SPACE
    lowp vec3 lightDir = vTangent * light.position - vTangentFragPos;
  #else
    lowp vec3 lightDir = light.position - vFragPos;
  #endif

  lowp float distance = length(lightDir);
  lightDir = lightDir / distance;

  // Attenuation
  lowp float attenuation = 1.0 / ( 1.0 +
    light.intensity.w * (distance * distance));

  lowp vec2 phong = calcPhong(lightDir, viewDir, normal);

  // Combine everything together
  lowp vec3 result = matColor.diffuse * light.intensity.g * phong.x;
  result += matColor.specular * light.intensity.b * phong.y;
  result += matColor.ambient * light.intensity.r;
  result *= attenuation;
  result *= light.color;

  return result;
}

lowp float decodeRGBToFloat(lowp vec3 v) {
  return dot(v, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));
}

lowp float decodeRGToFloat(lowp vec2 v) {
  return dot(v, vec2(1.0, 1.0 / 255.0));
}

lowp float linstep(lowp float low, lowp float high, lowp float v) {
  return clamp((v - low) / (high - low), 0.0, 1.0);
}

lowp float lerpShadow(lowp float depth, lowp float moment, lowp float compare) {
  if (compare <= depth) return 1.0;
  float p = smoothstep(compare - 0.0015, compare, depth);
  float variance = max(moment - depth * depth, 0.0001);
  float d = compare - depth;
  float pMax = variance / (variance + d * d);
  return max(p, pMax);
}

lowp float calcShadow(sampler2D shadowMap, lowp vec4 shadowCoord) {
  lowp vec3 lightPos = shadowCoord.xyz / shadowCoord.w;
  lightPos = lightPos * 0.5 + 0.5;

  lowp float shadow;

  if (lightPos.x < 0.0 || lightPos.x > 1.0 ||
    lightPos.y < 0.0 || lightPos.y > 1.0 ||
    lightPos.z < 0.0 || lightPos.z > 1.0
  ) {
    shadow = 1.0;
  } else {
    lowp vec4 lightValue = texture2D(shadowMap,
      lightPos.xy);
    lowp float lightDepth = decodeRGToFloat(lightValue.rg);
    shadow = lerpShadow(lightDepth, decodeRGToFloat(lightValue.ba), lightPos.z);
  }
  return shadow;
}

lowp vec3 calcPointShadow(PointShadowLight light, MaterialColor matColor, lowp vec3 viewDir,
  lowp vec3 normal, sampler2D shadowMap, lowp vec4 shadowCoord
) {
  #ifdef USE_TANGENT_SPACE
    lowp vec3 lightDir = vTangent * light.position - vTangentFragPos;
  #else
    lowp vec3 lightDir = light.position - vFragPos;
  #endif

  lowp float distance = length(lightDir);
  lightDir = lightDir / distance;

  // Attenuation
  lowp float attenuation = 1.0 / ( 1.0 +
    light.intensity.w * (distance * distance));

  lowp vec2 phong = calcPhong(lightDir, viewDir, normal);

  // Shadow
  lowp float shadow = calcShadow(shadowMap, shadowCoord);

  // Combine everything together
  lowp vec3 result = matColor.diffuse * light.intensity.g * phong.x;
  result += matColor.specular * light.intensity.b * phong.y;
  result *= shadow;
  result += matColor.ambient * light.intensity.r;
  result *= attenuation;
  result *= light.color;

  return result;
}

lowp vec3 calcSpot(SpotLight light, MaterialColor matColor, lowp vec3 viewDir,
  lowp vec3 normal
) {
  #ifdef USE_TANGENT_SPACE
    lowp vec3 lightDir = vTangent * light.position - vTangentFragPos;
  #else
    lowp vec3 lightDir = light.position - vFragPos;
  #endif

  lowp float distance = length(lightDir);
  lightDir = lightDir / distance;

  // Attenuation
  lowp float attenuation = 1.0 / ( 1.0 +
    light.intensity.w * (distance * distance));

  lowp vec2 phong = calcPhong(lightDir, viewDir, normal);

  // Spotlight
  lowp float intensity = 1.0;
  // Seriously?
  #ifdef USE_TANGENT_SPACE
    lowp float theta = dot(lightDir, vTangent * light.direction);
  #else
    lowp float theta = dot(lightDir, light.direction);
  #endif
  lowp float epsilon = light.angle.x - light.angle.y;
  intensity = clamp((theta - light.angle.y) / epsilon,
    0.0, 1.0);

  // Combine everything together
  lowp vec3 result = matColor.diffuse * light.intensity.g * phong.x;
  result += matColor.specular * light.intensity.b * phong.y;
  result *= intensity;
  result += matColor.ambient * light.intensity.r;
  result *= attenuation;
  result *= light.color;

  return result;

}

#ifdef USE_HEIGHT_MAP
  lowp vec2 heightMap(sampler2D heightMap, lowp vec2 texCoords, lowp vec3 viewDir) {
    if (uHeightMapScale.y != 0.0) {
      // Cheap but not fancy parallax mapping
      lowp float angle = min(1.0, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)) * uHeightMapScale.y);
      lowp float height = 1.0 - texture2D(heightMap, texCoords).r * 2.0;
      lowp vec2 p = viewDir.xy / viewDir.z * (height * uHeightMapScale.x * angle);
      return texCoords - p;
    } else {
      // Parallax occlusion mapping. Expensive..
      // TODO
      return vec2(0.0, 0.0);
    }
  }
#endif

void main(void) {
  #ifdef USE_TANGENT_SPACE
    lowp vec3 viewDir = normalize(vTangentViewPos - vTangentFragPos);
    // tangent, bi-tangent, normal.
    lowp vec3 normal = vec3(0.0, 0.0, 1.0);
  #else
    lowp vec3 viewDir = normalize(uViewPos - vFragPos);
    lowp vec3 normal = normalize(vNormal);
  #endif
  lowp vec2 texCoord = vTexCoord;

  #ifdef USE_HEIGHT_MAP
    texCoord = heightMap(uHeightMap, vTexCoord, viewDir);
    if (texCoord.x > 1.0 || texCoord.y > 1.0 ||
      texCoord.x < 0.0 || texCoord.y < 0.0
    ) {
      discard;
    }
  #endif

  #ifdef USE_NORMAL_MAP
    normal = (texture2D(uNormalMap, texCoord)).xyz;
    // Again, OpenGL uses inverted Y axis, so we need to invert this as well.
    normal.y = 1.0 - normal.y;
    normal = normalize(normal * 2.0 - 1.0);
  #endif

  MaterialColor matColor;
  matColor.ambient = uMaterial.ambient;
  matColor.diffuse = uMaterial.diffuse;
  matColor.specular = uMaterial.specular;

  #ifdef USE_DIFFUSE_MAP
    lowp vec4 diffuseTex = texture2D(uDiffuseMap, texCoord);
    matColor.ambient *= diffuseTex.xyz;
    matColor.diffuse *= diffuseTex.xyz;
  #endif

  #ifdef USE_SPECULAR_MAP
    lowp vec4 specularTex = texture2D(uSpecularMap, texCoord);
    matColor.specular *= specularTex.xyz;
  #endif

  lowp vec3 result = vec3(0.0, 0.0, 0.0);
  #if AMBIENT_LIGHT_SIZE > 0
    for (int i = 0; i < AMBIENT_LIGHT_SIZE; ++i) {
      if (i == uLightSize[0].x) break;
      result += calcAmbient(uAmbientLight[i], matColor);
    }
  #endif
  #if DIRECTIONAL_LIGHT_SIZE > 0
    for (int i = 0; i < DIRECTIONAL_LIGHT_SIZE; ++i) {
      if (i == uLightSize[0].y) break;
      result += calcDirectional(uDirectionalLight[i], matColor, viewDir, normal);
    }
  #endif
  #if POINT_LIGHT_SIZE > 0
    for (int i = 0; i < POINT_LIGHT_SIZE; ++i) {
      if (i == uLightSize[0].z) break;
      result += calcPoint(uPointLight[i], matColor, viewDir, normal);
    }
  #endif
  #if SPOT_LIGHT_SIZE > 0
    for (int i = 0; i < SPOT_LIGHT_SIZE; ++i) {
      if (i == uLightSize[0].w) break;
      result += calcSpot(uSpotLight[i], matColor, viewDir, normal);
    }
  #endif
  #if POINT_SHADOW_LIGHT_SIZE > 0
    for (int i = 0; i < POINT_SHADOW_LIGHT_SIZE; ++i) {
      if (i == uLightSize[1].x) break;
      result += calcPointShadow(uPointShadowLight[i], matColor, viewDir, normal,
        uPointShadowLightShadowMap[i], vPointShadowLightPos[i]);
    }
  #endif

  #ifdef USE_EMISSION_MAP
    lowp vec4 emissionTex = texture2D(uEmissionMap, texCoord);
    result += emissionTex.xyz;
  #endif

  gl_FragColor = vec4(result, 1.0);

}
