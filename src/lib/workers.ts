import { WasmRsComponent, WasmRsComponentInstance, Wick, wasi } from '@candlecorp/wick';
import ComponentWorker from './component-worker.js?worker&url';

import { dev } from '$app/environment';

interface ComponentWorker {
	component: WasmRsComponent;
	instance: WasmRsComponentInstance;
}

const wasiOpts: wasi.WasiOptions = {
	version: wasi.WasiVersions.SnapshotPreview1,
	args: [],
	env: {},
	preopens: {},
	stdin: 0,
	stdout: 1, // console in browser
	stderr: 2 // console in browser
};

export async function instantiateComponentWorkerFromBytes(
	buffer: Uint8Array
): Promise<WasmRsComponent> {
	try {
		let workerUrl: URL;
		/*
     importing `dev` from `$app/environment` is a svelte-specific way to get
     the correct worker URL for the environment.

     This may or may not be relevant in your UI framework of choice.
    */
		if (dev) {
			workerUrl = new URL('$lib/component-worker.js', import.meta.url);
		} else {
			workerUrl = new URL(ComponentWorker, import.meta.url);
		}

		const component = await Wick.Component.WasmRs.FromBytes(buffer, { wasi: wasiOpts, workerUrl });
		return component;
	} catch (e) {
		console.error(`Error instantiating component`, e);
		throw e;
	}
}
