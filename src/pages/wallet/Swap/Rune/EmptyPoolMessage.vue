<template>
  <div
    class="mb-4 flex items-center gap-4 rounded-xl border border-runes/30 bg-black/60 p-4 text-xs text-zinc-300 shadow shadow-runes/10"
    v-if="isEmpty"
  >
    <DropletsIcon class="h-6 w-6 text-runes" />
    <div class="space-y-1">
      <p>No liquidity has been added to this pool yet.</p>
      <p>Add liquidity to create a new pool.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmptyPoolMessage',
  props: {
    isEmpty: {
      type: Boolean,
      required: true,
    },
  },
}
</script>

<style scoped>

</style>
