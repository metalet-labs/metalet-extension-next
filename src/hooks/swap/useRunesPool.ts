import { computed } from 'vue'
import { useRouteParams } from '@vueuse/router'
import { runeTokens } from '@/data/pinned-tokens'

export default function useRunesPool() {
  const pairStr = useRouteParams<string>('pair')

  const token1 = computed(() => {
    if (!pairStr.value) {
      pairStr.value = `BTC-${runeTokens[0].runeid}`
    }
    return pairStr.value.split('-')[0]
  })
  const token2 = computed(() => {
    if (!pairStr.value) {
      pairStr.value = `BTC-${runeTokens[0].runeid}`
    }
    return pairStr.value.split('-')[1]
  })

  return {
    pairStr,
    token1,
    token2,
  }
}
