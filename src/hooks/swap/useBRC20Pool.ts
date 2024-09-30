import { computed, ref } from 'vue'
import { network } from '@/lib/network'
import { useRouteParams } from '@vueuse/router'
import { createGlobalState } from '@vueuse/core'

const useBRC20Pool = createGlobalState(() => {
  {
    const pairStrParam = useRouteParams<string>('pair')
    const pairStr = ref<string>(network.value === 'testnet' ? 'btc-xedr' : 'btc-orxc')

    const token1 = computed(() => pairStr.value.split('-')[0])
    const token2 = computed(() => pairStr.value.split('-')[1])

    const setPairStr = (_pairStr: string) => {
      pairStr.value = _pairStr
      pairStrParam.value = _pairStr
    }

    return {
      token1,
      token2,
      pairStr,
      setPairStr,
    }
  }
})

export default useBRC20Pool
