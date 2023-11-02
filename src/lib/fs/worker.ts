import DEBUG from 'debug';
import { WorkerMessageType, type WorkerMessage, type HostMessage } from './types.js';

const debug = DEBUG('wick:worker:fs');

export class Message {}

export interface Fetch {}

function sendMessage(message: WorkerMessage) {
	self.postMessage(message);
}

self.onmessage = async (e) => {
	const msg = e as MessageEvent<HostMessage>;
	const url = msg.data.entry.url;
	const path = msg.data.entry.path;
	debug('Downloading %s to %s', url, path);

	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);

		const contentLength = response.headers.get('Content-Length');

		const totalSize = contentLength ? parseInt(contentLength, 10) : undefined;

		const segments = path.split('/');
		const filename = segments[segments.length - 1];

		const root = await navigator.storage.getDirectory();
		let fileHandle;
		try {
			fileHandle = await root.getFileHandle(filename);
			const file = await fileHandle.getFile();
			if (file.size === totalSize) {
				sendMessage({
					type: WorkerMessageType.Progress,
					path,
					percentage: 100
				});
				return;
			}
		} catch (error) {
			// File doesn't exist or another error occurred, proceed to create and download.
			fileHandle = await root.getFileHandle(filename, { create: true });
		}

		if (!response.body) {
			sendMessage({ type: WorkerMessageType.Progress, path, percentage: 100 });
		} else {
			const accessHandle = await fileHandle.createSyncAccessHandle();
			try {
				accessHandle.truncate(0);
				const reader = response.body.getReader();

				let receivedSize = 0;
				let position = 0;
				// eslint-disable-next-line no-constant-condition
				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						sendMessage({ type: WorkerMessageType.Progress, path, percentage: 100 });
						break;
					}

					await accessHandle.write(value, { at: position });
					position += value.length;
					receivedSize += value.length;

					if (totalSize === undefined || isNaN(totalSize)) {
						sendMessage({ type: WorkerMessageType.Progress, path, percentage: undefined });
					} else {
						const percentage = Math.round((receivedSize / totalSize) * 100);
						sendMessage({ type: WorkerMessageType.Progress, path, percentage });
					}
				}
			} catch (e) {
				await accessHandle.flush();
				accessHandle.close();
				throw e;
			}
			await accessHandle.flush();
			accessHandle.close();
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error('Error downloading file:', error);
		sendMessage({
			path,
			type: WorkerMessageType.Error,
			message: error?.message || 'unknown error'
		});
	}
};
