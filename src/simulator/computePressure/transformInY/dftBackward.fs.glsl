#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D in_seq;

uniform int u_ny;

out vec4 out_seq;

void main(void) {
  int iq = int(gl_FragCoord.x);
  int j  = int(gl_FragCoord.y);
  int nh = u_ny / 2;
  float u_ny_inv = 1. / float(u_ny);
  float two_cos_pi_j = 0 == j % 2 ? 2. : -2.;
  out_seq = vec4(0.);
  // k = 0 and N / 2
  out_seq +=
    + texelFetch(in_seq, ivec2(iq,  0), 0)
    - texelFetch(in_seq, ivec2(iq, nh), 0);
  // k < N / 2 and N / 2 < k
  float pref = 6.283185307179586 * u_ny_inv;
  for (int k = 1; k < nh; k++) {
    // + 2 PI j k / N
    float phase = pref * float(j * (k - nh) % u_ny);
    out_seq += two_cos_pi_j * (
        + cos(phase) * texelFetch(in_seq, ivec2(iq,        k), 0)
        + sin(phase) * texelFetch(in_seq, ivec2(iq, u_ny - k), 0)
    );
  }
  // normalize fft
  out_seq *= u_ny_inv;
}

