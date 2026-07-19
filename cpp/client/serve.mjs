// static server for the emscripten build; COOP/COEP headers make the page
// cross-origin isolated, which SharedArrayBuffer (pthreads) requires
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const PORT = process.env.PORT || 8090;
const TYPES = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.wasm': 'application/wasm',
	'.data': 'application/octet-stream',
};

createServer( async ( req, res ) => {

	const path = req.url === '/' ? '/main.html' : req.url.split( '?' )[ 0 ];
	try {

		const data = await readFile( join( import.meta.dirname, path ) );
		res.writeHead( 200, {
			'Content-Type': TYPES[ extname( path ) ] || 'application/octet-stream',
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		} );
		res.end( data );

	} catch {

		res.writeHead( 404 );
		res.end( 'not found' );

	}

} ).listen( PORT, () => console.log( `serving on http://localhost:${ PORT }` ) );
