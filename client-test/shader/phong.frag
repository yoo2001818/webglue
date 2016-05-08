#version 100

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

const int AMBIENT_LIGHT_SIZE = 2;
const int DIRECTIONAL_LIGHT_SIZE = 2;
const int POINT_LIGHT_SIZE = 8;
const int SPOT_LIGHT_SIZE = 2;

uniform sampler2D uTexture;

uniform Material uMaterial;
uniform AmbientLight uAmbientLight[AMBIENT_LIGHT_SIZE];
uniform DirectionalLight uDirectionalLight[DIRECTIONAL_LIGHT_SIZE];
uniform PointLight uPointLight[POINT_LIGHT_SIZE];
uniform SpotLight uSpotLight[SPOT_LIGHT_SIZE];

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
  lowp vec4 texture = texture2D(uTexture, vTexCoord);

  matColor.ambient = texture.xyz * uMaterial.ambient;
  matColor.diffuse = texture.xyz * uMaterial.diffuse;

  matColor.specular = uMaterial.specular;

  lowp vec3 result = vec3(0.0, 0.0, 0.0);
  for (int i = 0; i < AMBIENT_LIGHT_SIZE; ++i) {
    result += calcAmbient(uAmbientLight[i], matColor);
  }
  for (int i = 0; i < DIRECTIONAL_LIGHT_SIZE; ++i) {
    result += calcDirectional(uDirectionalLight[i], matColor, viewDir);
  }
  for (int i = 0; i < POINT_LIGHT_SIZE; ++i) {
    result += calcPoint(uPointLight[i], matColor, viewDir);
  }
  for (int i = 0; i < SPOT_LIGHT_SIZE; ++i) {
    result += calcSpot(uSpotLight[i], matColor, viewDir);
  }

  gl_FragColor = vec4(result, 1.0);
}
