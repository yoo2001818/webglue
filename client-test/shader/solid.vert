attribute vec3 aPosition;
attribute vec3 aNormal;

struct Material {
  lowp vec3 specular;
  lowp vec3 diffuse;
  lowp vec3 ambient;
  lowp vec3 reflection;
  lowp float shininess;
};

uniform mat4 uProjectionView;
uniform mat4 uView;
uniform mat4 uViewInv;
uniform mat4 uModel;
uniform mat3 uModelInvTransp;
uniform vec3 uViewPos;

uniform Material uMaterial;

varying lowp vec3 vColor;

void main(void) {
  gl_Position = uProjectionView * uModel * vec4(aPosition, 1.0);

  lowp vec3 lightPos = uViewPos + (uViewInv * vec4(-0.5, 0.5, 0.0, 0.0)).xyz;

  lowp vec3 modelPos = uModel[3].xyz;

  // Calculate normal vector relative to the model matrix
  lowp vec3 normalDir = normalize(uModelInvTransp * aNormal);
  lowp vec3 viewDir = normalize(lightPos);
  lowp float lambertian = dot(normalDir, viewDir);

  if (lambertian > 0.4) {
    vColor = uMaterial.specular * pow(lambertian, uMaterial.shininess) +
      mix(uMaterial.ambient, uMaterial.diffuse, (lambertian - 0.4) / 0.6);
  } else {
    vColor = mix(uMaterial.ambient, uMaterial.reflection,
      (-lambertian + 0.4) / 0.8);
  }
}
