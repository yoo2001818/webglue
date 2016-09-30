#version 100
#pragma webglue: feature(USE_ENVIRONMENT_MAP, uEnvironmentMap)
#pragma webglue: feature(USE_DIFFUSE_MAP, uDiffuseMap)
#pragma webglue: feature(USE_NORMAL_MAP, uNormalMap)
#pragma webglue: feature(USE_HEIGHT_MAP, uHeightMap)
#pragma webglue: count(POINT_LIGHT_SIZE, uPointLight, maxLength)
#pragma webglue: feature(USE_DIRECTIONAL_LIGHT_SHADOW_MAP, uDirectionalLightShadowMap)

#if defined(USE_NORMAL_MAP) || defined(USE_HEIGHT_MAP)
  #define USE_TANGENT_SPACE
#endif

#ifndef POINT_LIGHT_SIZE
#define POINT_LIGHT_SIZE 1
#endif

precision lowp float;

lowp vec3 normal;
lowp vec3 fragPos;

varying lowp vec3 vPosition;
varying lowp vec3 vNormal;
varying lowp vec2 vTexCoord;
varying lowp vec3 vViewPos;

#ifdef USE_TANGENT_SPACE
  varying lowp vec4 vTangent;
  lowp mat3 tangent;
#endif

struct Material {
  lowp vec3 ambient;
  lowp vec3 diffuse;
  lowp vec3 specular;

  #ifdef USE_ENVIRONMENT_MAP
    lowp vec4 reflectivity;
  #endif
  lowp float shininess;
};

struct MaterialColor {
  lowp vec3 ambient;
  lowp vec3 diffuse;
  lowp vec3 specular;
};

struct PointLight {
  lowp vec3 position;

  lowp vec3 color;
  lowp vec4 intensity;
};

struct DirectionalLight {
  lowp vec3 direction;

  lowp vec3 color;
  lowp vec3 intensity;

  #ifdef USE_DIRECTIONAL_LIGHT_SHADOW_MAP
    lowp mat4 shadowMatrix;
  #endif
};

#if POINT_LIGHT_SIZE > 0
  uniform PointLight uPointLight[POINT_LIGHT_SIZE];
#endif

uniform DirectionalLight uDirectionalLight;
#ifdef USE_DIRECTIONAL_LIGHT_SHADOW_MAP
  uniform sampler2D uDirectionalLightShadowMap;
#endif

uniform Material uMaterial;

uniform mat4 uModel;
uniform mat3 uNormal;
uniform sampler2D uNormalMap;
uniform sampler2D uDiffuseMap;
uniform sampler2D uHeightMap;
uniform samplerCube uEnvironmentMap;

#ifdef USE_HEIGHT_MAP
  uniform lowp vec2 uHeightMapScale;
#endif
// It's Blinn-Phong actually.
lowp vec3 calcPhong(lowp vec3 lightDir, lowp vec3 viewDir) {
  // Diffuse
  lowp float lambertian = max(dot(lightDir, normal), 0.0);

  // Specular
  lowp float spec = 0.0;
  lowp float fresnel = 0.0;
  if (lambertian > 0.0) {
    lowp vec3 halfDir = normalize(lightDir + viewDir);
    lowp float specAngle = max(dot(halfDir, normal), 0.0);

    spec = pow(specAngle, uMaterial.shininess);
    fresnel = pow(1.0 - max(0.0, dot(halfDir, viewDir)), 5.0);
  }

  return vec3(lambertian, spec, fresnel);
}

lowp vec3 calcPoint(PointLight light, MaterialColor matColor, lowp vec3 viewDir
) {
  #ifdef USE_TANGENT_SPACE
    lowp vec3 lightDir = tangent * light.position - fragPos;
  #else
    lowp vec3 lightDir = light.position - fragPos;
  #endif

  lowp float distance = length(lightDir);
  lightDir = lightDir / distance;

  // Attenuation
  lowp float attenuation = 1.0 / ( 1.0 +
    light.intensity.w * (distance * distance));

  lowp vec3 phong = calcPhong(lightDir, viewDir);

  // Combine everything together
  lowp vec3 result = matColor.diffuse * light.intensity.g * phong.x;
  result += mix(matColor.specular, vec3(1.0), phong.z) *
    light.intensity.b * phong.y;
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
  float variance = max(moment - depth * depth, 0.00025);
  float d = compare - depth;
  float pMax = variance / (variance + d * d);
  return pMax;
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
    lowp float lightMoment = decodeRGToFloat(lightValue.ba);
    // if (lightDepth + 0.0005 >= lightPos.z) return 1.0;
    // return 0.0;
    shadow = lerpShadow(lightDepth, lightMoment, lightPos.z);
  }
  return shadow;
}

lowp vec3 calcDirectional(DirectionalLight light, MaterialColor matColor,
  lowp vec3 viewDir
) {
  #ifdef USE_TANGENT_SPACE
    lowp vec3 lightDir = tangent * light.direction;
  #else
    lowp vec3 lightDir = light.direction;
  #endif

  lowp vec3 phong = calcPhong(lightDir, viewDir);

  // Combine everything together
  lowp vec3 result = matColor.diffuse * light.intensity.g * phong.x;
  result += mix(matColor.specular, vec3(1.0), phong.z) *
    light.intensity.b * phong.y;
  #ifdef USE_DIRECTIONAL_LIGHT_SHADOW_MAP
    lowp float shadow = calcShadow(
      uDirectionalLightShadowMap,
      light.shadowMatrix * vec4(vPosition, 1.0));
    result *= shadow;
  #endif
  result += matColor.ambient * light.intensity.r;
  result *= light.color;

  return result;
}

void main(void) {
  #ifdef USE_TANGENT_SPACE
    // Normal vector.
    vec3 N = normalize(vNormal);
    // Tangent vector.
    vec3 T = normalize(vec3(uNormal * vTangent.xyz));
    T = normalize(T - dot(T, N) * N);
    // Bi-tangent vector.
    vec3 B = cross(T, N) * vTangent.w;
    // Transpose the matrix by hand
    tangent = mat3(
      vec3(T.x, B.x, N.x),
      vec3(T.y, B.y, N.y),
      vec3(T.z, B.z, N.z)
    );
    fragPos = tangent * vPosition;
    lowp vec3 viewDir = normalize(tangent * vViewPos - fragPos);
  #else
    fragPos = vPosition;
    lowp vec3 viewDir = normalize(vViewPos - fragPos);
    normal = normalize(vNormal);
  #endif

  lowp vec2 texCoord = vTexCoord;

  #ifdef USE_TANGENT_SPACE
    #ifdef USE_HEIGHT_MAP
      lowp float angle = min(1.0, pow(abs(dot(vec3(0.0, 0.0, 1.0), viewDir)), uHeightMapScale.y));
      lowp float height = texture2D(uHeightMap, vTexCoord).r * 2.0 - 1.0;
      lowp vec2 p = vec2(viewDir.x, -viewDir.y) / viewDir.z * (height * uHeightMapScale.x * angle);
      texCoord = vTexCoord + p;
    #endif
    #ifdef USE_NORMAL_MAP
      normal = normalize(texture2D(uNormalMap, texCoord).xyz * 2.0 - 1.0);
      normal.y = -normal.y;
    #else
      normal = vec3(0.0, 0.0, 1.0);
    #endif
  #endif

  MaterialColor matColor;
  matColor.ambient = uMaterial.ambient;
  matColor.diffuse = uMaterial.diffuse;
  matColor.specular = uMaterial.specular;

  #ifdef USE_DIFFUSE_MAP
  lowp vec4 diffuseTex = vec4(texture2D(uDiffuseMap, texCoord).xyz, 1.0);
  matColor.ambient *= diffuseTex.xyz;
  matColor.diffuse *= diffuseTex.xyz;
  #endif

  #ifdef USE_ENVIRONMENT_MAP
  lowp vec3 result = vec3(0.0, 0.0, 0.0);
	// TODO Support matte PBR (Disabled for now due to
	// https://github.com/KhronosGroup/WebGL/issues/1528)
	lowp vec4 environmentTex = vec4(0.0);
	if (uMaterial.reflectivity.w > 0.5) {
    #ifdef USE_TANGENT_SPACE
      // (Sigh) Get world space viewDir
      lowp vec3 worldViewDir = vViewPos - vPosition;
	    lowp vec3 outVec = reflect(worldViewDir, normal);
    #else
	    lowp vec3 outVec = reflect(viewDir, normal);
    #endif
	  environmentTex = vec4(textureCube(uEnvironmentMap, outVec).xyz, 1.0);
	} else {
		// Fallback: Sample random direction (to match colors)
	  environmentTex = vec4(textureCube(uEnvironmentMap, vec3(0.0, 0.0, 1.0)).xyz, 1.0);
	}
  lowp float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 5.0);
	result = environmentTex.xyz *
  mix(uMaterial.reflectivity.xyz, vec3(uMaterial.reflectivity.w), fresnel);
  lowp float power = mix(1.0, 1.0 - uMaterial.reflectivity.w, fresnel);
  matColor.ambient *= power;
  matColor.diffuse *= power;
  #else
  lowp vec3 result = vec3(0.0, 0.0, 0.0);
  #endif
	#if POINT_LIGHT_SIZE > 0
  for (int i = 0; i < POINT_LIGHT_SIZE; ++i) {
    result += calcPoint(uPointLight[i], matColor, viewDir);
  }
	#endif
  result += calcDirectional(uDirectionalLight, matColor, viewDir);

  gl_FragColor = vec4(result, 1.0);

}
