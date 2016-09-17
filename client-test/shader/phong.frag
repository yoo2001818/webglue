#version 100
#pragma webglue: feature(USE_DEPTH, uTexture)

precision lowp float;

varying lowp vec3 vPosition;
varying lowp vec3 vNormal;
varying lowp vec2 vTexCoord;

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

struct PointLight {
  lowp vec3 position;

  lowp vec3 color;
  lowp vec4 intensity;
};

uniform PointLight uPointLight[1];
uniform Material uMaterial;

uniform lowp mat4 uView;

uniform lowp vec3 uTint;
uniform sampler2D uTexture;

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

lowp vec3 calcPoint(PointLight light, MaterialColor matColor, lowp vec3 viewDir,
  lowp vec3 normal
) {
  lowp vec3 lightDir = light.position - vPosition;

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

void main(void) {
  lowp vec3 viewDir = normalize(-mat3(
    uView[0].x, uView[1].x, uView[2].x,
    uView[0].y, uView[1].y, uView[2].y,
    uView[0].z, uView[1].z, uView[2].z
    ) * uView[3].xyz - vPosition);
  lowp vec3 normal = normalize(vNormal);
  lowp vec2 texCoord = vTexCoord;
  MaterialColor matColor;
  matColor.ambient = uMaterial.ambient;
  matColor.diffuse = uMaterial.diffuse;
  matColor.specular = uMaterial.specular;

  #ifdef USE_DEPTH
  lowp vec4 diffuseTex = vec4(texture2D(uTexture, vTexCoord).xyz + uTint, 1.0);
  matColor.ambient *= diffuseTex.xyz;
  matColor.diffuse *= diffuseTex.xyz;
  #endif

  lowp vec3 result = vec3(0.0, 0.0, 0.0);
  for (int i = 0; i < 1; ++i) {
    result += calcPoint(uPointLight[i], matColor, viewDir, normal);
  }

  gl_FragColor = vec4(result, 1.0);

}
