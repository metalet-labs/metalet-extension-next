import { computed, ref } from 'vue'
import { useRouteParams } from '@vueuse/router'
import { createGlobalState } from '@vueuse/core'
import { runeTokens } from '@/data/pinned-tokens'

const useRunesPool = createGlobalState(() => {
  const pairStr = ref(`BTC-${runeTokens[0].runeid}`)
  const pairStrParam = useRouteParams<string>('pair')

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
})

export default useRunesPool
