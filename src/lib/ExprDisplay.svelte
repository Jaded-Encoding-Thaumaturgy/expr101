<script lang="ts">
  import type { OperatorTree } from "./parse";

  let { trees }: { trees: OperatorTree[] } = $props();

  let hovered = $state<number | undefined>(undefined);

  const operators: number[] = $derived((hovered ? trees[hovered].children : []).map((c) => trees.findIndex(t => t.token.start === c.token.start)));

  const spanColor = $derived((i: number): string => {
    const index = operators.findIndex((o) => o === i);
    if (i === hovered) {
      return "operator";
    } else if (index !== -1) {
      return `operand-${index % 3 + 1}`;
    } else if (trees[i].errors.length) {
      return "error";
    }
    return "";
  });
</script>

<div>
  {#each trees as tree, i (i)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- I'm too bad at ARIA to know which role is appropriate here, patches welcome! -->
    <span class={spanColor(i)} onmouseenter={() => {hovered = i}} onmouseleave={() => {hovered = undefined}}>
      {tree.token.text}
    </span>
    {#if i !== trees.length}
      {" "}
    {/if}
  {/each}
</div>

<style>

div {
  font-family: monospace;
}

.operator {
  background-color: #708cd8;
}

.operand-1 {
  background-color: #d8a970;
}

.operand-2 {
  background-color: #9ad870;
}

.operand-3 {
  background-color: #70d8ca;
}

.error {
  background-color: #d87970;
}

</style>
