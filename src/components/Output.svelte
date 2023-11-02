<script lang="ts">
	export let lines: string[] = [];
</script>

<section class="terminal">
	<div class="bar">
		<svg xmlns="http://www.w3.org/2000/svg" width="54" height="14" viewBox="0 0 54 14">
			<g fill="none" fill-rule="evenodd" transform="translate(1 1)">
				<circle cx="6" cy="6" r="6" fill="#FF5F56" stroke="#E0443E" stroke-width=".5" />
				<circle cx="26" cy="6" r="6" fill="#FFBD2E" stroke="#DEA123" stroke-width=".5" />
				<circle cx="46" cy="6" r="6" fill="#27C93F" stroke="#1AAB29" stroke-width=".5" />
			</g>
		</svg>
	</div>

	{#each lines as line}
		<p class="output">
			{#each line.split('\n') as outputLine}
				{outputLine}<br />
			{/each}
		</p>
	{/each}
</section>

<style>
	.terminal {
		font-family: monospace;
		background: #333;
		padding: 0.7rem 1rem;
		border-radius: 0.5rem;
		color: #b8b8b8;
		overflow: hidden;
	}

	.terminal .bar {
		margin-bottom: 1rem;
	}

	p {
		margin: 0.2rem 0;
	}

	p.output {
		font-weight: normal;
		white-space: pre;
	}
</style>
