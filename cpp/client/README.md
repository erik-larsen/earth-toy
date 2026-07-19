### Flycam client

Streams Google Earth's rocktree octree data (`kh.google.com/rt/earth/`) and renders
a flycam view. Builds native (macOS) and as WebAssembly.

Controls: Mouse, W, A, S, D and Shift key for boost

#### Prerequisites (macOS)

```sh
brew install protobuf@21 sdl2 glew
```

- protobuf is pinned to **3.21.12** (`protobuf@21`, keg-only): it's the last
  pre-abseil release, so the exact same version can also be compiled for wasm
  without dragging abseil into the emscripten link. For wasm, `rebuild.sh`
  downloads and compiles that runtime into `../vendor/protobuf-3.21.12`
  automatically on the first `wasm` build (one-time, a few minutes); the paths it
  links against are in [`config_emscripten.sh`](./config_emscripten.sh).
- For wasm builds: [emsdk](https://github.com/emscripten-core/emsdk) checked out at
  `~/Github/emsdk` (tested with emcc 4.0.12). If yours lives elsewhere, edit the
  `source ~/Github/emsdk/emsdk_env.sh` line in [`rebuild.sh`](./rebuild.sh).

#### Build

```sh
./rebuild.sh          # native -> ./main
./rebuild.sh wasm     # emscripten -> main.html / main.js / main.wasm
./rebuild.sh all      # both
./rebuild.sh serve    # serve the wasm build on http://localhost:8090
```

`rebuild.sh` sets up the protobuf@21 and emsdk environments and calls
[`build.sh`](./build.sh) (which can also be invoked directly if your environment
is already configured: `./build.sh` or `./build.sh emscripten`).

#### Run

- Native: `./main` (run from this directory)
- Wasm: `./rebuild.sh serve`, then open http://localhost:8090

The wasm build uses pthreads, so the page must be **cross-origin isolated** —
[`serve.mjs`](./serve.mjs) sends the required COOP/COEP headers; a plain static
file server will fail with a missing-`SharedArrayBuffer` error. Fetches to
`kh.google.com` work cross-origin because Google reflects the request origin in
its CORS headers.

Note: the on-disk `cache/` for native builds is intentionally disabled upstream
(`readFile`/`writeFile` in [`rocktree_http.h`](./rocktree_http.h) short-circuit),
so the empty cache directory is expected.

#### TODO:

```
- improve download order
- abort emscripten_fetch_close() https://emscripten.org/docs/api_reference/fetch.html
  and/or emscripten coroutine fetch semaphore	
- purge branches less aggressively	
- workers instead of shared mem https://emscripten.org/docs/api_reference/emscripten.h.html#worker-api	
```
