import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
	optimizeDeps: {
		include: ['debug', 'rsocket-core', 'web-worker']
	},

	resolve: {
		alias: {
			'wasmrs-js': './node_modules/wasmrs-js/dist/src/browser/index.js'
		}
	},

	plugins: [mkcert(), nodePolyfills(), sveltekit()]
});
