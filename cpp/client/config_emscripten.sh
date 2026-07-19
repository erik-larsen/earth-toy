#!/bin/bash

# protobuf built for wasm lives in ../vendor (see vendor/protobuf-3.21.12);
# protoc comes from homebrew protobuf@21 — same 3.21.12 version, so the
# generated code matches the wasm-built runtime
VENDOR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../vendor" && pwd)"
EMSCRIPTEN_PROTOBUF_SRC="$VENDOR/protobuf-3.21.12/src"
EMSCRIPTEN_PROTOBUF_LIB="$VENDOR/protobuf-3.21.12/src/.libs/libprotobuf.a"
EMSCRIPTEN_PROTOBUF_EXE="/opt/homebrew/opt/protobuf@21/bin/protoc"
