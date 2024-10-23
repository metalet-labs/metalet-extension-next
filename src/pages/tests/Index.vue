<script setup lang="ts">
import { getPassword } from '@/lib/lock'
import { process } from '@/lib/actions/common/ecdh'
</script>

<template>
  <div class="w-full py-2 flex items-center justify-center">
    <button
      class="text-lg"
      @click="
        async () => {
          const password = await getPassword()
          const data = await process(
            {
              externalPubKey:
                '040227de44169fc5faed3e03a300c9cf800e9a88e716c3284be484d720ffcc21e60283728dbf422b3865a8ee3779db46a4a3685aa87ed53512cf7c77e288267235',
            },
            { password }
          )
          console.log('data', data)
        }
      "
    >
      test
    </button>
  </div>
</template>

<style scoped lang="css"></style>
