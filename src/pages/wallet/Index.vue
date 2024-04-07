<script lang="ts" setup>
import Balance from './components/Balance.vue'
import AccountHeader from './AccountHeader.vue'
import AssetTabs from './components/AssetTabs.vue'

</script>

<template>
  <div class="nicer-scrollbar space-y-6">
    <AccountHeader  />

    <Balance />

    <AssetTabs />
  </div>
</template>
