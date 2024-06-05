import { onMounted, ref } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { getFtOfficialToken } from '@/queries/tokens'
export const useOfficeGenesisStore = createGlobalState(() => {
  const genesisList = ref<string[]>([])

  function isOfficeGenesis(genesis: string) {
    return genesisList.value.includes(genesis)
  }

  onMounted(async () => {
    genesisList.value = await getFtOfficialToken()
  })

  return {
    isOfficeGenesis,
  }
})
