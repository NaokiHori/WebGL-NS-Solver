#version 300 es

precision highp float;
precision highp sampler2D;

const float PI = 3.1415926535897932384626433832795;

uniform sampler2D rhs;
uniform vec2 u_resolution;
uniform vec2 u_grid_size;

out vec4 lhs;

void main(void) {
  float nx = u_resolution.x;
  float ny = u_resolution.y;
  int iq = int(gl_FragCoord.x);
  int j  = int(gl_FragCoord.y);
  vec4 wavexs = vec4(
      sin(PI * float(4 * iq + 0) / (2. * nx)),
      sin(PI * float(4 * iq + 1) / (2. * nx)),
      sin(PI * float(4 * iq + 2) / (2. * nx)),
      sin(PI * float(4 * iq + 3) / (2. * nx))
  );
  float wavey = sin(PI * float(j) / ny);
  wavexs = vec4(
      - pow(2. / u_grid_size.x * wavexs[0], 2.),
      - pow(2. / u_grid_size.x * wavexs[1], 2.),
      - pow(2. / u_grid_size.x * wavexs[2], 2.),
      - pow(2. / u_grid_size.x * wavexs[3], 2.)
  );
  wavey = - pow(2. / u_grid_size.y * wavey,  2.);
  vec4 values = texelFetch(rhs, ivec2(iq, j), 0);
  lhs = values / (wavexs + vec4(wavey));
  if (0 == iq && 0 == j) {
    lhs.r = 0.;
  }
}

