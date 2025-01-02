#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D in_seq;

uniform int u_nx;

out vec4 out_seq;

void main(void) {
  int iq = int(gl_FragCoord.x);
  int j  = int(gl_FragCoord.y);
  int qn = 4 * u_nx;
  float pref = 6.283185307179586 / float(qn);
  out_seq = vec4(0.);
  for (int kq = 0; kq < u_nx / 4; kq++) {
    // contains four wavenumber information
    vec4 freq = texelFetch(in_seq, ivec2(kq, j), 0);
    if (0 == kq) {
      // correct zero-th wave number prefactor
      freq.r *= 0.5;
    }
    out_seq += vec4(
        dot(vec4(
            cos(pref * float((2 * (4 * iq + 0) + 1) * (4 * kq + 0) % qn)),
            cos(pref * float((2 * (4 * iq + 0) + 1) * (4 * kq + 1) % qn)),
            cos(pref * float((2 * (4 * iq + 0) + 1) * (4 * kq + 2) % qn)),
            cos(pref * float((2 * (4 * iq + 0) + 1) * (4 * kq + 3) % qn))
        ), freq),
        dot(vec4(
            cos(pref * float((2 * (4 * iq + 1) + 1) * (4 * kq + 0) % qn)),
            cos(pref * float((2 * (4 * iq + 1) + 1) * (4 * kq + 1) % qn)),
            cos(pref * float((2 * (4 * iq + 1) + 1) * (4 * kq + 2) % qn)),
            cos(pref * float((2 * (4 * iq + 1) + 1) * (4 * kq + 3) % qn))
        ), freq),
        dot(vec4(
            cos(pref * float((2 * (4 * iq + 2) + 1) * (4 * kq + 0) % qn)),
            cos(pref * float((2 * (4 * iq + 2) + 1) * (4 * kq + 1) % qn)),
            cos(pref * float((2 * (4 * iq + 2) + 1) * (4 * kq + 2) % qn)),
            cos(pref * float((2 * (4 * iq + 2) + 1) * (4 * kq + 3) % qn))
        ), freq),
        dot(vec4(
            cos(pref * float((2 * (4 * iq + 3) + 1) * (4 * kq + 0) % qn)),
            cos(pref * float((2 * (4 * iq + 3) + 1) * (4 * kq + 1) % qn)),
            cos(pref * float((2 * (4 * iq + 3) + 1) * (4 * kq + 2) % qn)),
            cos(pref * float((2 * (4 * iq + 3) + 1) * (4 * kq + 3) % qn))
        ), freq)
    );
  }
  // normalize
  out_seq /= 0.5 * float(u_nx);
}
