#version 300 es

precision highp float;
precision highp sampler2D;

const float BC_L = 1.;
const float BC_R = 0.;

uniform sampler2D ux;
uniform sampler2D uy;
uniform sampler2D temp;

uniform ivec2 u_resolution;
uniform vec2 u_grid_size;
uniform float u_time_step_size;
uniform float u_diffusivity;

out float new_temp;

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
  // surrounding velocities
  float ux_m0 =           texelFetch(ux, ivec2(i    , j    ), 0).r;
  float ux_p0 = !isR(i) ? texelFetch(ux, ivec2(i + 1, j    ), 0).r
                        : 0.;
  float uy_0m =           texelFetch(uy, ivec2(i    , j    ), 0).r;
  float uy_0p = !isT(j) ? texelFetch(uy, ivec2(i    , j + 1), 0).r
                        : texelFetch(uy, ivec2(i    ,     0), 0).r;
  // surrounding temperatures
  float temp_00 =           + texelFetch(temp, ivec2(i    , j    ), 0).r;
  float temp_m0 = !isL(i) ? + texelFetch(temp, ivec2(i - 1, j    ), 0).r
                          : - texelFetch(temp, ivec2(    0, j    ), 0).r + 2. * BC_L;
  float temp_p0 = !isR(i) ? + texelFetch(temp, ivec2(i + 1, j    ), 0).r
                          : - texelFetch(temp, ivec2(m - 1, j    ), 0).r + 2. * BC_R;
  float temp_0m = !isB(j) ? + texelFetch(temp, ivec2(i    , j - 1), 0).r
                          : + texelFetch(temp, ivec2(i    , n - 1), 0).r;
  float temp_0p = !isT(j) ? + texelFetch(temp, ivec2(i    , j + 1), 0).r
                          : + texelFetch(temp, ivec2(i    ,     0), 0).r;
  float adv =
    - dxinv * (
        - ux_m0 * 0.5 * (temp_m0 + temp_00)
        + ux_p0 * 0.5 * (temp_00 + temp_p0)
    )
    - dyinv * (
        - uy_0m * 0.5 * (temp_0m + temp_00)
        + uy_0p * 0.5 * (temp_00 + temp_0p)
    );
  float dif =
    + u_diffusivity * pow(dxinv, 2.) * (temp_m0 - 2. * temp_00 + temp_p0)
    + u_diffusivity * pow(dyinv, 2.) * (temp_0m - 2. * temp_00 + temp_0p);
  new_temp = temp_00 + (adv + dif) * u_time_step_size;
  new_temp = clamp(new_temp, 0., 1.);
}
