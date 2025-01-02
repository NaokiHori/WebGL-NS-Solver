#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D ux;
uniform sampler2D uy;
uniform sampler2D temp;

uniform ivec2 u_resolution;
uniform vec2 u_grid_size;
uniform float u_time_step_size;
uniform float u_diffusivity;

out float new_ux;

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
  int i = int(gl_FragCoord.x);
  int j = int(gl_FragCoord.y);
  if (isL(i)) {
    new_ux = 0.;
    return;
  }
  int n = u_resolution.y;
  float dxinv = 1. / u_grid_size[0];
  float dyinv = 1. / u_grid_size[1];
  // surrounding x velocities
  float ux_00 =           + texelFetch(ux, ivec2(i    , j    ), 0).r;
  float ux_m0 =           + texelFetch(ux, ivec2(i - 1, j    ), 0).r;
  float ux_p0 = !isR(i) ? + texelFetch(ux, ivec2(i + 1, j    ), 0).r
                        : 0.; // impermeable
  float ux_0m = !isB(j) ? + texelFetch(ux, ivec2(i    , j - 1), 0).r
                        : + texelFetch(ux, ivec2(i    , n - 1), 0).r;
  float ux_0p = !isT(j) ? + texelFetch(ux, ivec2(i    , j + 1), 0).r
                        : + texelFetch(ux, ivec2(i    ,     0), 0).r;
  // surrounding y velocities
  float uy_mm =           + texelFetch(uy, ivec2(i - 1, j    ), 0).r;
  float uy_pm =           + texelFetch(uy, ivec2(i    , j    ), 0).r;
  float uy_mp = !isT(j) ? + texelFetch(uy, ivec2(i - 1, j + 1), 0).r
                        : + texelFetch(uy, ivec2(i - 1,     0), 0).r;
  float uy_pp = !isT(j) ? + texelFetch(uy, ivec2(i    , j + 1), 0).r
                        : + texelFetch(uy, ivec2(i    , n - 1), 0).r;
  // surrounding temperatures
  float temp_m0 = texelFetch(temp, ivec2(i - 1, j    ), 0).r;
  float temp_p0 = texelFetch(temp, ivec2(i    , j    ), 0).r;
  // evaluate terms
  float adv =
    - dxinv * (
        - 0.5 * (ux_m0 + ux_00) * 0.5 * (ux_m0 + ux_00)
        + 0.5 * (ux_00 + ux_p0) * 0.5 * (ux_00 + ux_p0)
    )
    - dyinv * (
        - 0.5 * (uy_mm + uy_pm) * 0.5 * (ux_0m + ux_00)
        + 0.5 * (uy_mp + uy_pp) * 0.5 * (ux_00 + ux_0p)
    );
  float dif =
    + u_diffusivity * pow(dxinv, 2.) * (ux_m0 - 2. * ux_00 + ux_p0)
    + u_diffusivity * pow(dyinv, 2.) * (ux_0m - 2. * ux_00 + ux_0p);
  float buoyancy = 0.5 * (temp_m0 + temp_p0);
  // compute new velocity at ij
  new_ux = ux_00 + (adv + dif + buoyancy) * u_time_step_size;
  new_ux = clamp(new_ux, -0.5, 0.5);
}
