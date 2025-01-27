<script lang="ts">
  import ExprDisplay from "./lib/ExprDisplay.svelte";
  import { buildTrees, tokenize } from "./lib/parse";

  let expr = $state("");
  const trees = $derived(buildTrees(tokenize(expr)));
</script>

<main>
  <input type="text" placeholder="Enter your expression here" bind:value={expr} />
  <ExprDisplay trees={trees} />
</main>

<style>
input {
  background-color: var(--expr-input-background-color);
  border: 1px solid var(--expr-input-border-color);
  border-radius: 3px;
  color: var(--expr-body-text-color);
  width: 90%;
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 8px;
}
</style>
