export interface FileEntry {
	path: string;
	url: string;
}

export enum HostMessageType {
	Fetch
}

export type HostMessage = FetchMessage;

export interface FetchMessage {
	type: HostMessageType.Fetch;
	entry: FileEntry;
}

export enum WorkerMessageType {
	Progress,
	Complete,
	Error
}

export type WorkerMessage = ProgressMessage | CompleteMessage | ErrorMessage;

export interface ProgressMessage {
	type: WorkerMessageType.Progress;
	percentage: number | undefined;
	path: string;
}

export interface CompleteMessage {
	type: WorkerMessageType.Complete;
	path: string;
}

export interface ErrorMessage {
	type: WorkerMessageType.Error;
	path: string;
	message: string;
}
