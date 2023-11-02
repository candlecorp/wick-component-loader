<script lang="ts">
	export let header: string | undefined = undefined;
</script>

<div class="w-full mt-4">
	{#if header}
		<h2 class="text-center text-lg font-bold">{header}</h2>
	{/if}
	<slot />
</div>

<style>
</style>
