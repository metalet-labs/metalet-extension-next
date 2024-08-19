import { computed } from 'vue'
import { useRouteParams } from '@vueuse/router'

export default function useBTCPool() {
  const pairStr = useRouteParams<string>('pair')
  if (!pairStr.value) {
    pairStr.value = `BTC-WBTC`
  }

  const token1 = computed(() => pairStr.value.split('-')[0])
  const token2 = computed(() => pairStr.value.split('-')[1])

  return {
    pairStr,
    token1,
    token2,
  }
}
