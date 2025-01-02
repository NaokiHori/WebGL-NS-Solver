#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D in_seq;

uniform int u_ny;

out vec4 out_seq;

void main(void) {
  int iq = int(gl_FragCoord.x);
  int k  = int(gl_FragCoord.y);
  float u_ny_inv = 1. / float(u_ny);
  float pref = - 6.283185307179586 * u_ny_inv;
  out_seq = vec4(0.);
  if (k < u_ny / 2 + 1) {
    for (int j = 0; j < u_ny; j++) {
      vec4 phys = texelFetch(in_seq, ivec2(iq, j), 0);
      out_seq += cos(pref * float(j * k % u_ny)) * phys;
    }
  } else {
    for (int j = 0; j < u_ny; j++) {
      vec4 phys = texelFetch(in_seq, ivec2(iq, j), 0);
      out_seq += sin(pref * float(j * k % u_ny)) * phys;
    }
  }
}

