#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D ux;
uniform sampler2D uy;

uniform ivec2 u_resolution;
uniform vec2 u_grid_size;

out vec4 new_psi;

bool isR(int iq) {
  return iq == u_resolution.x / 4 - 1;
}

bool isT(int j) {
  return j == u_resolution.y - 1;
}

float compute_local_divergence(
    float ux_m0,
    float ux_p0,
    float uy_0m,
    float uy_0p
) {
  return
    + 1. / u_grid_size.x * (- ux_m0 + ux_p0)
    + 1. / u_grid_size.y * (- uy_0m + uy_0p);
}

void main(void) {
  int iq = int(gl_FragCoord.x);
  int j  = int(gl_FragCoord.y);
  float uxs[5] = float[](
                 texelFetch(ux, ivec2(4 * iq + 0, j    ), 0).r,
                 texelFetch(ux, ivec2(4 * iq + 1, j    ), 0).r,
                 texelFetch(ux, ivec2(4 * iq + 2, j    ), 0).r,
                 texelFetch(ux, ivec2(4 * iq + 3, j    ), 0).r,
      !isR(iq) ? texelFetch(ux, ivec2(4 * iq + 4, j    ), 0).r
               : 0.
  );
  float uys[8] = float[](
                texelFetch(uy, ivec2(4 * iq + 0, j    ), 0).r,
                texelFetch(uy, ivec2(4 * iq + 1, j    ), 0).r,
                texelFetch(uy, ivec2(4 * iq + 2, j    ), 0).r,
                texelFetch(uy, ivec2(4 * iq + 3, j    ), 0).r,
      !isT(j) ? texelFetch(uy, ivec2(4 * iq + 0, j + 1), 0).r
              : texelFetch(uy, ivec2(4 * iq + 0,     0), 0).r,
      !isT(j) ? texelFetch(uy, ivec2(4 * iq + 1, j + 1), 0).r
              : texelFetch(uy, ivec2(4 * iq + 1,     0), 0).r,
      !isT(j) ? texelFetch(uy, ivec2(4 * iq + 2, j + 1), 0).r
              : texelFetch(uy, ivec2(4 * iq + 2,     0), 0).r,
      !isT(j) ? texelFetch(uy, ivec2(4 * iq + 3, j + 1), 0).r
              : texelFetch(uy, ivec2(4 * iq + 3,     0), 0).r
  );
  new_psi = vec4(
      compute_local_divergence(
        uxs[0], uxs[1], uys[0], uys[4]
      ),
      compute_local_divergence(
        uxs[1], uxs[2], uys[1], uys[5]
      ),
      compute_local_divergence(
        uxs[2], uxs[3], uys[2], uys[6]
      ),
      compute_local_divergence(
        uxs[3], uxs[4], uys[3], uys[7]
      )
  );
}

