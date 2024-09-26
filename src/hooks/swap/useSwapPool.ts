import { ref } from 'vue'
import useRunesPool from './useRunesPool'
import useBRC20Pool from './useBRC20Pool'
import { toast } from '@/components/ui/toast'
import { useRouteParams } from '@vueuse/router'
import { Protocol } from '@/lib/types/protocol'
import { Chain } from '@metalet/utxo-wallet-service'

export function useSwapPool() {
  const chain = useRouteParams<string>('chain')
  if (!chain.value) {
    chain.value = Chain.BTC
  }

  const protocol = useRouteParams<string>('protocol')

  if (!protocol.value) {
    if (chain.value === Chain.BTC) {
      protocol.value = Protocol.BRC20.toLocaleLowerCase()
    } else if (chain.value === Chain.MVC) {
      protocol.value = Protocol.MetaContract.toLocaleLowerCase()
    } else {
      toast({ toastType: 'warning', title: 'Unsupported chain type.' })
      return { token1: ref(''), token2: ref(''), chain, protocol }
    }
  }

  if (protocol.value === Protocol.Runes.toLocaleLowerCase()) {
    return { ...useRunesPool(), chain, protocol }
  } else if (protocol.value === Protocol.BRC20.toLocaleLowerCase()) {
    return { ...useBRC20Pool(), chain, protocol }
  } else {
    toast({ toastType: 'warning', title: 'Unsupported protocol type.' })
    window.history.back()
  }

  return { token1: ref(''), token2: ref(''), pairStr: ref(''), chain, protocol }
}
