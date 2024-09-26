import { network } from '@/lib/network'
import { type Ref, computed } from 'vue'
import { useRouteParams } from '@vueuse/router'

export default function useBRC20Pool() {
  let pairStr = useRouteParams('pair') as Ref<string>

  const token1 = computed(() => {
    if (!pairStr.value) {
      if (network.value === 'testnet') {
        pairStr.value = 'btc-xedr'
      } else {
        // pairStr.value = 'btc-rdex'
        pairStr.value = 'btc-orxc'
      }
    }
    return pairStr.value.split('-')[0]
  })
  const token2 = computed(() => {
    if (!pairStr.value) {
      if (network.value === 'testnet') {
        pairStr.value = 'btc-xedr'
      } else {
        // pairStr.value = 'btc-rdex'
        pairStr.value = 'btc-orxc'
      }
    }
    return pairStr.value.split('-')[1]
  })

  return {
    pairStr,
    token1,
    token2,
  }
}
