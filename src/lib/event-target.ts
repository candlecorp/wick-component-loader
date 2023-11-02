export interface TypedEventTargetInterface<T> extends EventTarget {
	on<K extends keyof T>(
		type: K,
		listener: (ev: T[K]) => void,
		options?: EventListenerOptions | boolean
	): void;
}

export class TypedEventTarget<T> extends EventTarget implements TypedEventTargetInterface<T> {
	on<K extends keyof T>(
		type: K,
		listener: (ev: T[K]) => void,
		options?: EventListenerOptions | boolean
	) {
		this.addEventListener(type as string, listener as EventListener, options);
	}
}
