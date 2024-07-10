import { computed } from 'vue'
import { useRouteParams } from '@vueuse/router'
import { runeTokens } from '@/data/pinned-tokens'

export function useRunesPool() {
  const pairStr = useRouteParams<string>('pair')
  if (!pairStr.value) {
    // use default
    pairStr.value = `BTC-${runeTokens[0].runeid}`
  }

  const token1 = computed(() => pairStr.value.split('-')[0])
  const token2 = computed(() => pairStr.value.split('-')[1])

  return {
    pairStr,
    token1,
    token2,
  }
}
