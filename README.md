# [WebGL NS Solver](https://naokihori.github.io/WebGL-NS-Solver/index.html)

[![License](https://img.shields.io/github/license/NaokiHori/WebGL-NS-Solver)](https://opensource.org/license/mit/)
[![Last Commit](https://img.shields.io/github/last-commit/NaokiHori/WebGL-NS-Solver/main)](https://github.com/NaokiHori/WebGL-NS-Solver/commits/main)
[![CI](https://github.com/NaokiHori/WebGL-NS-Solver/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/NaokiHori/WebGL-NS-Solver/actions/workflows/ci.yml)

A toy Navier-Stokes solver powered by the GPU, designed to run directly in web browsers.

## Requirements

- [WebGL2](https://caniuse.com/?search=webgl2)
- [EXT_color_buffer_float API](https://caniuse.com/?search=color_buffer_float)

## Caveat

This is really a toy solver to create something on GPU.
The performance is far from being optimal (mainly due to the limitations of WebGL2).
