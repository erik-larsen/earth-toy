
Documenting Google Earth data structures.

#### Status
The focus has been on the 3D satellite mode, which required digging into:
- URL structures
- octrees and conversion from geo coordinates
- Protobuf formats of assets and metadata
- postprocessing steps (e.g. unpacking of meshes and textures)

Code was written and tested with various regions and cities:
- [Flycam client](./client/) (C++, native + WebAssembly)
- [Model exporter](./exporter/) (JS)

#### Info

URL structure:
```
"https://kh.google.com/rt/🅐/🅑"
 - 🅐: planet
       - "earth"
       - "mars"
       - ...
 - 🅑: resource
       - "PlanetoidMetadata"
       - "BulkMetadata/pb=!1m2!1s❶!2u❷"
          - ❶: octant path
          - ❷: epoch
       - "NodeData/pb=!1m2!1s❸!2u❹!2e❺(!3u❻)!4b0"
          - ❸: octant path
          - ❹: epoch
          - ❺: texture format
          - ❻: imagery epoch (sometimes)
```

Misc:
```
General info:
 - Everything is stored in an octree.

Roles of resources:
 - PlanetoidMetadata points to first BulkMetaData.
 - BulkMetaData points to other BulkMetaData and to NodeData.
 - NodeData contains actual meshes and textures.

Versioning:
 - BulkMetaData and NodeData are versioned using epoch numbers.
 - PlanetoidMetadata provides epoch of first BulkMetaData.
 - BulkMetaData provides epochs of underlying resources.
 - Current version of a resource can be determined recursively.

NodeData:
 - Mesh: packed XYZ, UV, octant mask, normals
 - Texture: JPG, CRN-DXT1
 - Raw format: see rocktree.proto and rocktree_decoder.h
 - Other optimizations: BVH
BulkMetaData:
 - Oriented Bounding Box
    - [Dump OBB to obj](./exporter/obb_dump_obj.js)
    - [Latlong to octant using OBB (unstable)](./exporter/experimental_latlong_to_octant.js)
```
