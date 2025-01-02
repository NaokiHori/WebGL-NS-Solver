#version 300 es

precision lowp float;
precision lowp sampler2D;

uniform sampler2D scalar;
uniform ivec2 u_resolution;

in vec2 v_texture_coordinates;

out vec4 frag_color;

const float BC_L = 1.;
const float BC_R = 0.;

bool isL(ivec2 ij) {
  return ij.x == 0;
}

bool isR(ivec2 ij) {
  return ij.x == u_resolution.x - 1;
}

bool isB(ivec2 ij) {
  return ij.y == 0;
}

bool isT(ivec2 ij) {
  return ij.y == u_resolution.y - 1;
}

float get_value_mm(ivec2 ij) {
  if (isL(ij)) {
    return BC_L;
  } else if (isB(ij)) {
    return
      + 0.25 * texelFetch(scalar, ivec2(ij.x - 1, u_resolution.y - 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x    , u_resolution.y - 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x - 1,                  0), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x    ,                  0), 0).r;
  } else {
    return
      + 0.25 * texelFetch(scalar, ivec2(ij.x - 1, ij.y - 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x    , ij.y - 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x - 1, ij.y    ), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x    , ij.y    ), 0).r;
  }
}

float get_value_mp(ivec2 ij) {
  if (isL(ij)) {
    return BC_L;
  } else if (isT(ij)) {
    return
      + 0.25 * texelFetch(scalar, ivec2(ij.x - 1, u_resolution.y - 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x    , u_resolution.y - 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x - 1,                  0), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x    ,                  0), 0).r;
  } else {
    return
      + 0.25 * texelFetch(scalar, ivec2(ij.x - 1, ij.y    ), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x    , ij.y    ), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x - 1, ij.y + 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x    , ij.y + 1), 0).r;
  }
}

float get_value_pm(ivec2 ij) {
  if (isR(ij)) {
    return BC_R;
  } else if (isB(ij)) {
    return
      + 0.25 * texelFetch(scalar, ivec2(ij.x    , u_resolution.y - 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x + 1, u_resolution.y - 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x    ,                  0), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x + 1,                  0), 0).r;
  } else {
    return
      + 0.25 * texelFetch(scalar, ivec2(ij.x    , ij.y - 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x + 1, ij.y - 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x    , ij.y    ), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x + 1, ij.y    ), 0).r;
  }
}

float get_value_pp(ivec2 ij) {
  if (isR(ij)) {
    return BC_R;
  } else if (isT(ij)) {
    return
      + 0.25 * texelFetch(scalar, ivec2(ij.x    , u_resolution.y - 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x + 1, u_resolution.y - 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x    ,                  0), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x + 1,                  0), 0).r;
  } else {
    return
      + 0.25 * texelFetch(scalar, ivec2(ij.x    , ij.y    ), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x + 1, ij.y    ), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x    , ij.y + 1), 0).r
      + 0.25 * texelFetch(scalar, ivec2(ij.x + 1, ij.y + 1), 0).r;
  }
}

vec3 value_to_color(float value) {
  value = clamp(value, 0., 1.);
  value = 2. * value - 1.;
  vec3 color = vec3(0.);
  float l = 0.75;
  if (value < 0.) {
    color[0] = 0. - l * value;
  } else if (value < 0.5) {
    color[0] = 0. + 2. * value;
  } else {
    color[0] = 1.;
  }
  if (value < 0.) {
    color[1] = 0. - l * value;
  } else {
    color[1] = 0. + l * value;
  }
  if (value < -0.5) {
    color[2] = 1.;
  } else if (value < 0.) {
    color[2] = 0. - 2. * value;
  } else {
    color[2] = 0. + l * value;
  }
  return color;
}

void main(void) {
  vec2 texel_size = 1. / vec2(u_resolution);
  // [i : i + 1, j : j + 1] for each texel
  vec2 xy = v_texture_coordinates / texel_size;
  // (i, j)
  ivec2 ij = ivec2(xy);
  // [0 : 1, 0 : 1] inside texel
  vec2 tex_coords_frac = fract(xy);
  float value_mm = get_value_mm(ij);
  float value_mp = get_value_mp(ij);
  float value_pm = get_value_pm(ij);
  float value_pp = get_value_pp(ij);
  float value = mix(
      mix(value_mm, value_pm, tex_coords_frac.x),
      mix(value_mp, value_pp, tex_coords_frac.x),
      tex_coords_frac.y
  );
  frag_color = vec4(value_to_color(value), 1.);
}

