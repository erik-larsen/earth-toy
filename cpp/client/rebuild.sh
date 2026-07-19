#!/bin/bash
# Rebuild the earth client. Usage:
#   ./rebuild.sh            native build -> ./main
#   ./rebuild.sh wasm       emscripten build -> main.html/main.js/main.wasm
#   ./rebuild.sh all        both
#   ./rebuild.sh serve      serve the wasm build on :8090 (COOP/COEP headers)
#
# Requires: brew install protobuf@21 sdl2 glew; emsdk checked out at ~/Github/emsdk
# (protobuf pinned to 3.21.12 = last pre-abseil release, so the same version can
# be built for wasm; see ../vendor/protobuf-3.21.12)
set -euo pipefail
cd "$(dirname "$0")"

export PATH="/opt/homebrew/opt/protobuf@21/bin:$PATH"
export PKG_CONFIG_PATH="/opt/homebrew/opt/protobuf@21/lib/pkgconfig:${PKG_CONFIG_PATH:-}"

PB_VER="3.21.12"       # library version (in the tarball name)
PB_TAG="21.12"         # matching git release tag (protobuf dropped the "3." prefix)
PB_DIR="../vendor/protobuf-$PB_VER"
PB_LIB="$PB_DIR/src/.libs/libprotobuf.a"

# Build protobuf for wasm once (the emscripten link needs a wasm-compiled
# libprotobuf.a; homebrew's is native-only). Idempotent: skips if already built.
bootstrap_protobuf_wasm() {
	[ -f "$PB_LIB" ] && return 0
	echo "bootstrapping wasm protobuf $PB_VER (one-time, a few minutes)..."
	mkdir -p ../vendor
	if [ ! -d "$PB_DIR" ]; then
		local tgz="../vendor/protobuf-cpp-$PB_VER.tar.gz"
		# -f: fail (non-zero exit) on HTTP errors instead of saving the error body
		[ -f "$tgz" ] || curl -fSL \
			"https://github.com/protocolbuffers/protobuf/releases/download/v$PB_TAG/protobuf-cpp-$PB_VER.tar.gz" \
			-o "$tgz"
		tar xzf "$tgz" -C ../vendor
	fi
	( cd "$PB_DIR" \
		&& emconfigure ./configure --disable-shared --disable-maintainer-mode \
			--host=wasm32-unknown-emscripten >/dev/null \
		&& emmake make -j"$(sysctl -n hw.ncpu)" -C src libprotobuf.la >/dev/null )
	echo "wasm protobuf built: $PB_LIB"
}

case "${1:-native}" in
	native)
		./build.sh
		echo "built ./main — run it from this directory"
		;;
	wasm|emscripten)
		EMSDK_QUIET=1 source ~/Github/emsdk/emsdk_env.sh
		bootstrap_protobuf_wasm
		./build.sh emscripten
		echo "built main.html — serve with: ./rebuild.sh serve"
		;;
	all)
		"$0" native
		"$0" wasm
		;;
	serve)
		exec node serve.mjs
		;;
	*)
		echo "usage: $0 [native|wasm|all|serve]" >&2
		exit 1
		;;
esac
