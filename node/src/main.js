import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GlobeControls, TilesRenderer } from '3d-tiles-renderer';
import {
	CesiumIonAuthPlugin,
	GLTFExtensionsPlugin,
	GoogleCloudAuthPlugin,
	TileCompressionPlugin,
	TilesFadePlugin,
	UpdateOnChangePlugin,
} from '3d-tiles-renderer/plugins';

// Google Photorealistic 3D Tiles, via either a Google Maps Platform key
// (requires billing) or a free Cesium ion account (asset 2275207)
const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const ionToken = import.meta.env.VITE_ION_TOKEN;
if ( ! googleKey && ! ionToken ) {

	const message = document.getElementById( 'message' );
	message.style.display = 'grid';
	message.innerHTML = `
		<div>
			No API credentials found. Copy <code>.env.example</code> to <code>.env</code>,
			set one of the two variables, and restart the dev server:<br><br>
			<code>VITE_ION_TOKEN</code> — free Cesium ion account, no credit card
			(<a href="https://ion.cesium.com/signup" style="color:#8fd0ff">sign up</a>,
			then Access Tokens &rarr; copy the default token)<br>
			<code>VITE_GOOGLE_MAPS_API_KEY</code> — Google Cloud key with the Map Tiles API
			enabled (requires a billing account)
		</div>`;
	throw new Error( 'Set VITE_ION_TOKEN or VITE_GOOGLE_MAPS_API_KEY' );

}

// the window can report 0x0 when booted in a hidden tab, which would poison the
// camera projection matrix with NaN and silently cull every tile
function viewSize() {

	return [ window.innerWidth || 1280, window.innerHeight || 720 ];

}

const renderer = new WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( ...viewSize() );
document.getElementById( 'app' ).appendChild( renderer.domElement );

const scene = new Scene();
const [ initWidth, initHeight ] = viewSize();
const camera = new PerspectiveCamera( 60, initWidth / initHeight, 100, 1e8 );

// start roughly 2.5 earth radii out so the whole globe is in view
camera.position.set( 0, 0.5e7, 1.6e7 );
camera.lookAt( 0, 0, 0 );

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/' );

const tiles = new TilesRenderer();
if ( googleKey ) {

	tiles.registerPlugin( new GoogleCloudAuthPlugin( { apiToken: googleKey, autoRefreshToken: true } ) );

} else {

	tiles.registerPlugin( new CesiumIonAuthPlugin( { apiToken: ionToken, assetId: '2275207', autoRefreshToken: true } ) );

}
tiles.registerPlugin( new GLTFExtensionsPlugin( { dracoLoader } ) );
tiles.registerPlugin( new TileCompressionPlugin() );
tiles.registerPlugin( new UpdateOnChangePlugin() );
tiles.registerPlugin( new TilesFadePlugin() );
tiles.setCamera( camera );
tiles.setResolutionFromRenderer( camera, renderer );

// tilesets are z-up; rotate into three.js's y-up frame
tiles.group.rotation.x = - Math.PI / 2;
scene.add( tiles.group );

const controls = new GlobeControls( scene, camera, renderer.domElement );
controls.setEllipsoid( tiles.ellipsoid, tiles.group );
controls.enableDamping = true;

const attributionsEl = document.getElementById( 'attributions' );

function onResize() {

	const [ width, height ] = viewSize();
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	renderer.setSize( width, height );
	tiles.setResolutionFromRenderer( camera, renderer );

}

window.addEventListener( 'resize', onResize );

function tick() {

	controls.update();
	camera.updateMatrixWorld();
	tiles.update();
	renderer.render( scene, camera );

	attributionsEl.textContent = tiles
		.getAttributions()
		.map( ( a ) => a.value )
		.join( ' • ' );

}

renderer.setAnimationLoop( tick );

// debug handles for driving the app from a hidden tab, where rAF never fires
window.__tiles = tiles;
window.__tick = tick;
