#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D in_seq;

uniform int u_nx;

out vec4 freq;

void main(void) {
  int kq = int(gl_FragCoord.x);
  int j  = int(gl_FragCoord.y);
  int qn = 4 * u_nx;
  float pref = 6.283185307179586 / float(qn);
  freq = vec4(0.);
  for (int iq = 0; iq < u_nx / 4; iq++) {
    // contains four spatial values
    vec4 phys = texelFetch(in_seq, ivec2(iq, j), 0);
    freq += vec4(
        dot(vec4(
            cos(pref * float((2 * (4 * iq + 0) + 1) * (4 * kq + 0) % qn)),
            cos(pref * float((2 * (4 * iq + 1) + 1) * (4 * kq + 0) % qn)),
            cos(pref * float((2 * (4 * iq + 2) + 1) * (4 * kq + 0) % qn)),
            cos(pref * float((2 * (4 * iq + 3) + 1) * (4 * kq + 0) % qn))
        ), phys),
        dot(vec4(
            cos(pref * float((2 * (4 * iq + 0) + 1) * (4 * kq + 1) % qn)),
            cos(pref * float((2 * (4 * iq + 1) + 1) * (4 * kq + 1) % qn)),
            cos(pref * float((2 * (4 * iq + 2) + 1) * (4 * kq + 1) % qn)),
            cos(pref * float((2 * (4 * iq + 3) + 1) * (4 * kq + 1) % qn))
        ), phys),
        dot(vec4(
            cos(pref * float((2 * (4 * iq + 0) + 1) * (4 * kq + 2) % qn)),
            cos(pref * float((2 * (4 * iq + 1) + 1) * (4 * kq + 2) % qn)),
            cos(pref * float((2 * (4 * iq + 2) + 1) * (4 * kq + 2) % qn)),
            cos(pref * float((2 * (4 * iq + 3) + 1) * (4 * kq + 2) % qn))
        ), phys),
        dot(vec4(
            cos(pref * float((2 * (4 * iq + 0) + 1) * (4 * kq + 3) % qn)),
            cos(pref * float((2 * (4 * iq + 1) + 1) * (4 * kq + 3) % qn)),
            cos(pref * float((2 * (4 * iq + 2) + 1) * (4 * kq + 3) % qn)),
            cos(pref * float((2 * (4 * iq + 3) + 1) * (4 * kq + 3) % qn))
        ), phys)
    );
  }
}

