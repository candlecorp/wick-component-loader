import { WorkerMessageType, type WorkerMessage } from './types.js';

export class FetchEvent extends Event {
	path: string;
	constructor(type: string, path: string) {
		super(type);
		this.path = path;
	}
}

export class FetchProgress extends FetchEvent {
	progress: number;

	constructor(path: string, progress: number) {
		super('progress', path);
		this.progress = progress;
	}
}

export class FetchComplete extends FetchEvent {
	constructor(path: string) {
		super('complete', path);
	}
}

export class FetchError extends FetchEvent {
	message: string;
	constructor(path: string, message: string) {
		super('error', path);
		this.message = message;
	}
}

export function workerMessageToEvent(message: WorkerMessage) {
	switch (message.type) {
		case WorkerMessageType.Progress:
			return new FetchProgress(message.path, message.percentage);
		case WorkerMessageType.Complete:
			return new FetchComplete(message.path);
		case WorkerMessageType.Error:
			return new FetchError(message.path, message.message);
	}
}
