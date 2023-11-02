import { FetchComplete, FetchError, FetchProgress, workerMessageToEvent } from './fs/events.js';
import {
	HostMessageType,
	type HostMessage,
	type WorkerMessage,
	type FileEntry
} from './fs/types.js';
import { WorkerKind, loadWorker } from './workers.js';
import { TypedEventTarget } from './event-target.js';

interface FsEvents {
	progress: FetchProgress;
	complete: FetchComplete;
	error: FetchError;
}

export class FsRequest extends TypedEventTarget<FsEvents> {
	entry: FileEntry;

	constructor(entry: FileEntry) {
		super();
		this.entry = entry;
		this.addEventListener('complete', () => {});
	}

	handleMessage(msg: MessageEvent<WorkerMessage>) {
		const event = workerMessageToEvent(msg.data);
		this.dispatchEvent(event);
	}
}

class Fs extends EventTarget {
	private requests = new Map<string, FsRequest>();

	constructor(private worker: Worker) {
		super();
		worker.addEventListener('message', (msg: MessageEvent<WorkerMessage>) => {
			const request = this.requests.get(msg.data.path);
			if (!request) return;
			request.handleMessage(msg);
		});
	}

	static start(): Fs {
		const worker = loadWorker('global', WorkerKind.Fs);

		return new Fs(worker);
	}

	async fetch(entry: FileEntry): Promise<FsRequest> {
		await this.sendMessage({ type: HostMessageType.Fetch, entry });
		const request = new FsRequest(entry);
		this.requests.set(entry.path, request);
		return request;
	}

	private async sendMessage(message: HostMessage) {
		const worker = await this.worker;

		worker.postMessage(message);
	}
}

export const fs = Fs.start();
