# earth-toy

Experiments in streaming and rendering planet-scale 3D map data. Two independent
subprojects, each with its own toolchain:

| Directory | What it is | Language / stack | Data source |
|-----------|-----------|------------------|-------------|
| [`node/`](node/) | Photorealistic globe you can spin and zoom in the browser | JavaScript, [three.js](https://threejs.org/) + [`3d-tiles-renderer`](https://github.com/NASA-AMMOS/3DTilesRendererJS), bundled with Vite | Google Photorealistic 3D Tiles (via a free [Cesium ion](https://ion.cesium.com/) token or a Google Maps key) |
| [`cpp/`](cpp/) | Flycam client that streams Google Earth's raw octree ("rocktree") tiles | C++, SDL2 + OpenGL/WebGL, builds native **and** to WebAssembly | `kh.google.com` (anonymous) |

The two are unrelated in code — pick whichever you want to work on. `node/` is the
quick one to run; `cpp/` is lower-level and more involved to build.

---

## `node/` — browser globe

A three.js app that streams Google's photorealistic tiles through the
NASA-AMMOS `3d-tiles-renderer` library, with globe controls (drag to orbit,
scroll to zoom from space down to street level).

### Prerequisites

- **Node.js 22.12+** (or 20.19+ on the Node 20 LTS line) and npm — Vite 8's
  requirement. Check with `node --version`; install from <https://nodejs.org/> or
  `brew install node`.

### Get a Cesium ion token (free)

Google Photorealistic 3D Tiles are included with a free Cesium ion account, which
is the credit-card-free way to stream them.

1. Create an account at <https://ion.cesium.com/signup/> (email + password; no
   payment details).
2. Sign in — you land on the **My Assets** dashboard. "Google Photorealistic 3D
   Tiles" (asset `2275207`) is already available to every account; you don't need
   to add it.
3. Open the **Access Tokens** tab at the top of the dashboard.
4. Copy the **Default Token** (its value starts with `eyJ…`). This default token
   already has read access to all assets on your account, including the Google
   tiles, so no extra configuration is needed.
   - If you'd rather make a dedicated token: **Create token**, and under
     *Asset access* make sure **Google Photorealistic 3D Tiles** is included, then
     copy that token instead.

### Setup

```bash
cd node
cp .env.example .env      # then paste your token into VITE_ION_TOKEN
npm install
```

`.env.example` also documents `VITE_GOOGLE_MAPS_API_KEY` as an alternative source
for the same tiles, but that route requires a Google Cloud billing account — the
Cesium token above is the no-cost path.

### Run

```bash
cd node
npm run dev       # dev server at http://localhost:5173
npm run build     # production build into node/dist
npm run preview   # serve the production build
```

Open <http://localhost:5173>; the globe appears and refines as tiles stream in. If
you see a "No API credentials found" screen, `.env` is missing or the token is
blank. Under Claude Code, the `dev` server is also registered in
[`.claude/launch.json`](.claude/launch.json) and can be started from the Browser pane.

---

## `cpp/` — native + WebAssembly rocktree client

A C++ flycam that fetches and decodes Google Earth's octree tiles. Builds as a
native macOS binary and as a WebAssembly page. Full details, prerequisites, and
the protobuf pinning rationale are in
[`cpp/client/README.md`](cpp/client/README.md).

### Prerequisites (macOS)

```bash
xcode-select --install                       # clang + command line tools
brew install protobuf@21 sdl2 glew           # native build deps
```

For the **WebAssembly** target you also need the Emscripten SDK. `rebuild.sh`
expects it at `~/Github/emsdk`:

```bash
git clone https://github.com/emscripten-core/emsdk ~/Github/emsdk
cd ~/Github/emsdk && ./emsdk install latest && ./emsdk activate latest
```

(If you keep emsdk elsewhere, edit the `source ~/Github/emsdk/emsdk_env.sh` line in
[`cpp/client/rebuild.sh`](cpp/client/rebuild.sh).) The first wasm build also
compiles protobuf for wasm into `cpp/vendor/`, which takes a few minutes; that's a
one-time cost. Native builds need only the Homebrew deps above.

### Build & run

```bash
cd cpp/client
./rebuild.sh            # native  -> ./main   (run: ./main)
./rebuild.sh wasm       # wasm    -> main.html / main.js / main.wasm
./rebuild.sh all        # both
./rebuild.sh serve      # serve the wasm build at http://localhost:8090
```

- Native: run `./main` from that directory; controls are mouse + W/A/S/D, Shift to boost.
- WebAssembly: `./rebuild.sh serve` uses a small server that sends the COOP/COEP
  headers the pthreads build needs (`SharedArrayBuffer` requires a cross-origin
  isolated page).

---

## Repository layout

```
earth-toy/
├── node/                     # browser globe (three.js + 3d-tiles-renderer, Vite)
│   ├── src/main.js           # the whole app
│   ├── index.html
│   └── .env                  # your Cesium ion / Google token (git-ignored)
├── cpp/                      # native + wasm Google Earth rocktree client (C++)
│   ├── README.md             # rocktree URL structure & data-format notes
│   ├── client/               # main.cpp, build.sh, rebuild.sh, serve.mjs, README.md
│   ├── proto/ exporter/ earth-utils/
│   └── vendor/               # wasm-compiled protobuf (bootstrapped, git-ignored)
└── .claude/launch.json       # dev-server definitions for the Browser pane
```
