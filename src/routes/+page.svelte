<script lang="ts">
	import { decode, encode } from '@msgpack/msgpack';
	import { Button, Dropzone, Input, Label, Select, Textarea } from 'flowbite-svelte';
	import { Observable, from } from 'rxjs';
	import { Packet, WasmRsComponent, type OperationDefinition } from '@candlecorp/wick';
	import { instantiateComponentWorkerFromBytes } from '$lib/workers';
	import { onDestroy } from 'svelte';
	import Section from '../components/Section.svelte';
	import { header } from '../styles';
	import Output from '../components/Output.svelte';
	import { writable, type Writable } from 'svelte/store';

	let operation: undefined | OperationDefinition;
	let operations: OperationDefinition[] = [];

	let invocationResult: Writable<string[]> = writable([]);

	let component: WasmRsComponent | undefined;

	async function loadComponent(buffer: Uint8Array): Promise<void> {
		if (!component) {
			component = await instantiateComponentWorkerFromBytes(buffer);
		}

		operations = component.signature.operations;
		operation = operations[0];
	}

	function createOperationConfig(operation: OperationDefinition): Record<string, any> {
		const config = {} as any;

		for (const field of operation.config) {
			const input = document.getElementById(`config_${field.name}`) as HTMLInputElement;
			config[field.name] = field.type === 'string' ? input.value : JSON.parse(input.value);
		}
		return config;
	}

	function createInputStream(operation: OperationDefinition): Observable<Packet> {
		const inputs = [];

		for (const field of operation.inputs) {
			const input = document.getElementById(`input_${field.name}`) as HTMLInputElement;
			let value = field.type === 'string' ? input.value : JSON.parse(input.value);
			inputs.push(new Packet(field.name, encode(value)));
			inputs.push(Packet.Done(field.name));
		}

		return from(inputs);
	}

	async function invoke(component: WasmRsComponent, operation: OperationDefinition): Promise<void> {
		const instance = await component.instantiate({ config: {} });

		// Component and Operation configuration is a generic object, this method grabs
		// data from the UI.
		const config = createOperationConfig(operation);

		// Operation inputs are sent as a stream of Packet objects.
		// Packets are encoded values with an input name and any signal flags.
		const stream = createInputStream(operation);

		// Invoke the operation and subscribe to the returned Observable.
		const result = await instance.invoke(operation.name, stream, config);

		result.subscribe({
			next(packet) {
				// Each packet contains the output name, data, and signal flags

				// If the doesn't have data, ignore it. We're only interested in stuff
				// we can print.
				if (!packet.data) {
					return;
				}

				// Decode our data into a JavaScript value:
				const value = decode(packet.data);

				// Update the UI with the JSON-ified return value;
				invocationResult.update((v) => {
					v.push(JSON.stringify(value));
					return v;
				});
			},
			complete() {
				// When we're done, print <Done>
				invocationResult.update((v) => {
					v.push('<Done>');
					return v;
				});
			},
			error(err) {
				// If we get an error, print it and log it.
				invocationResult.update((v) => {
					v.push(`<Error:${err}>`);
					return v;
				});
				console.error(err);
			}
		});
	}

	onDestroy(cleanup);

	function cleanup() {
		if (component) {
			component.terminate();
		}
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		const files = e.dataTransfer?.files;
		fromFileList(files);
	}

	function onChange(e: Event) {
		const target = e.target as HTMLInputElement | undefined;
		const files = target?.files || undefined;
		fromFileList(files);
	}

	function fromFileList(files?: FileList) {
		cleanup();
		if (!files) return;
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			console.log({ fileType: file.type });
			if (file.type.startsWith('application/wasm')) {
				file.arrayBuffer().then((buffer) => {
					loadComponent(new Uint8Array(buffer));
				});
			}
		}
	}

	function handleExecute(e: MouseEvent) {
		if (!component) {
			console.warn('component already terminated, aborting invocation');
			return;
		}
		if (!operation) {
			console.warn('no operation, aborting invocation');
			return;
		}

		invoke(component, operation);
	}

	const fieldLabel = 'w-1/3 text-right pr-5';
	const fieldInput = 'w-2/3 ';
	const fieldItem = 'flex flex-row items-center w-full';
	const blockHeader = 'text-center';
</script>

<h1 class={header}>Wick Component Loader</h1>
<Section header="WasmRS File">
	{#if !component}
		<Dropzone
			on:drop={onDrop}
			on:dragover={(event) => {
				event.preventDefault();
			}}
			on:change={onChange}
			class="flex flex-col justify-center items-center w-full bg-gray-50 h-fit rounded-lg border-2 border-gray-300 border-dashed cursor-pointer dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
		>
			<div class="h-64 flex flex-col justify-center items-center">
				<svg
					aria-hidden="true"
					class="mb-3 w-10 h-10 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
					/></svg
				>
				<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
					<span class="font-semibold">Click to upload</span> or drag and drop
				</p>
				<p class="text-xs text-gray-500 dark:text-gray-400">a Wick component .wasm file</p>
			</div>
		</Dropzone>
	{:else}
		<div
			class="p-5 flex flex-col justify-center items-center w-full h-64 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
		>
			<div class="flex flex-row items-center w-full">
				<Label for="operation">Operation</Label>
				<Select
					id="operation"
					class=""
					items={operations.map((ex) => ({
						value: ex,
						name: ex.name
					}))}
					bind:value={operation}
				/>
			</div>
			{#if operation}
				<div class="w-full">
					{#if operation.config.length > 0}
						<h3 class={blockHeader}>Configuration</h3>
					{/if}
					{#each operation.config as field}
						<div class={fieldItem}>
							<Label for="config_{field.name}" text={field.name} class={fieldLabel}
								><b>{field.name}</b></Label
							>
							<Input id="config_{field.name}" class={fieldInput} placeholder="" />
						</div>
					{/each}

					{#if operation.inputs.length > 0}
						<h3 class={blockHeader}>Inputs</h3>
					{/if}

					{#each operation.inputs as field}
						<div class={fieldItem}>
							<Label for="input_{field.name}" text={field.name} class={fieldLabel}
								><b>{field.name}</b></Label
							>
							<Input id="input_{field.name}" class={fieldInput} />
						</div>
					{/each}
				</div>
				<Button on:click={handleExecute} class="mt-2">Execute</Button>
			{/if}
		</div>
		{#if $invocationResult.length > 0}
			<div class="mt-3">
				<Output lines={$invocationResult} />
			</div>
		{/if}
	{/if}
</Section>
