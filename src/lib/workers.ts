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
	stdout: 1,
	stderr: 2
};

export async function instantiateComponentWorkerFromBytes(
	buffer: Uint8Array
): Promise<WasmRsComponent> {
	try {
		let workerUrl: URL;
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
