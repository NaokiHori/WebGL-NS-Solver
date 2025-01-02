#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D ux;
uniform sampler2D uy;

uniform ivec2 u_resolution;
uniform vec2 u_grid_size;
uniform float u_time_step_size;
uniform float u_diffusivity;

out float new_uy;

bool isL(int i) {
  return i == 0;
}

bool isR(int i) {
  return i == u_resolution.x - 1;
}

bool isB(int j) {
  return j == 0;
}

bool isT(int j) {
  return j == u_resolution.y - 1;
}

void main(void) {
  int m = u_resolution.x;
  int n = u_resolution.y;
  int i = int(gl_FragCoord.x);
  int j = int(gl_FragCoord.y);
  float dxinv = 1. / u_grid_size[0];
  float dyinv = 1. / u_grid_size[1];
  // surrounding x velocities
  float ux_mm = !isB(j)           ? texelFetch(ux, ivec2(i    , j - 1), 0).r
                                  : texelFetch(ux, ivec2(i    , n - 1), 0).r;
  float ux_pm = !isR(i) ? !isB(j) ? texelFetch(ux, ivec2(i + 1, j - 1), 0).r
                                  : texelFetch(ux, ivec2(i + 1, n - 1), 0).r
                                  : 0.;
  float ux_mp =                     texelFetch(ux, ivec2(i    , j    ), 0).r;
  float ux_pp = !isR(i)           ? texelFetch(ux, ivec2(i + 1, j    ), 0).r
                                  : 0.;
  // surrounding y velocities
  float uy_00 =           + texelFetch(uy, ivec2(i    , j    ), 0).r;
  float uy_m0 = !isL(i) ? + texelFetch(uy, ivec2(i - 1, j    ), 0).r
                        : - texelFetch(uy, ivec2(    0, j    ), 0).r;
  float uy_p0 = !isR(i) ? + texelFetch(uy, ivec2(i + 1, j    ), 0).r
                        : - texelFetch(uy, ivec2(m - 1, j    ), 0).r;
  float uy_0m = !isB(j) ? + texelFetch(uy, ivec2(i    , j - 1), 0).r
                        : + texelFetch(uy, ivec2(i    , n - 1), 0).r;
  float uy_0p = !isT(j) ? + texelFetch(uy, ivec2(i    , j + 1), 0).r
                        : + texelFetch(uy, ivec2(i    ,     0), 0).r;
  // evaluate terms
  float adv =
    - dxinv * (
        - 0.5 * (ux_mm + ux_mp) * 0.5 * (uy_m0 + uy_00)
        + 0.5 * (ux_pm + ux_pp) * 0.5 * (uy_00 + uy_p0)
    )
    - dyinv * (
        - 0.5 * (uy_0m + uy_00) * 0.5 * (uy_0m + uy_00)
        + 0.5 * (uy_00 + uy_0p) * 0.5 * (uy_00 + uy_0p)
    );
  float dif =
    + u_diffusivity * pow(dxinv, 2.) * (uy_m0 - 2. * uy_00 + uy_p0)
    + u_diffusivity * pow(dyinv, 2.) * (uy_0m - 2. * uy_00 + uy_0p);
  new_uy = uy_00 + (adv + dif) * u_time_step_size;
  new_uy = clamp(new_uy, -0.5, 0.5);
}
