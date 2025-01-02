#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D ux;
uniform sampler2D pressure;

uniform float u_dx;

out float new_ux;

bool isL(int i) {
  return i == 0;
}

void main(void) {
  int i = int(gl_FragCoord.x);
  int j = int(gl_FragCoord.y);
  if (isL(i)) {
    new_ux = 0.;
    return;
  }
  int iq = i / 4;
  float pres_m0 = 0.;
  float pres_p0 = 0.;
  if (0 == i % 4) {
    pres_m0 = texelFetch(pressure, ivec2(iq - 1, j    ), 0)[3];
    pres_p0 = texelFetch(pressure, ivec2(iq    , j    ), 0)[0];
  } else {
    vec4 values = texelFetch(pressure, ivec2(iq, j), 0);
    pres_m0 = values[i % 4 - 1];
    pres_p0 = values[i % 4    ];
  }
  new_ux =
    texelFetch(ux, ivec2(i, j), 0).r
    -
    1. / u_dx * (
        - pres_m0
        + pres_p0
    );
}
