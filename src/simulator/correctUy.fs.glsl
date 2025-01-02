#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D uy;
uniform sampler2D pressure;

uniform int u_ny;
uniform float u_dy;

out float new_uy;

bool isB(int j) {
  return j == 0;
}

void main(void) {
  int i = int(gl_FragCoord.x);
  int j = int(gl_FragCoord.y);
  int n = u_ny;
  int iq = i / 4;
  float pres_0m = !isB(j) ? texelFetch(pressure, ivec2(iq, j - 1), 0)[i % 4]
                          : texelFetch(pressure, ivec2(iq, n - 1), 0)[i % 4];
  float pres_0p =           texelFetch(pressure, ivec2(iq, j    ), 0)[i % 4];
  new_uy =
    texelFetch(uy, ivec2(i, j), 0).r
    -
    1. / u_dy * (
        - pres_0m
        + pres_0p
    );
}
