import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from '@/components/ui/toast'
import { useRunesPool } from './useRunesPool'
import { useRouteParams } from '@vueuse/router'
import { Protocol } from '@/lib/types/protocol'
import { Chain } from '@metalet/utxo-wallet-service'

const router = useRouter()

export function useSwapPool() {
  const chain = useRouteParams<string>('chain')
  if (!chain.value) {
    chain.value = Chain.BTC
  }

  const protocol = useRouteParams<string>('protocol')
  if (!protocol.value) {
    if (chain.value === Chain.BTC) {
      protocol.value = Protocol.Rune.toLocaleLowerCase()
    } else if (chain.value === Chain.MVC) {
      protocol.value = Protocol.MetaContract.toLocaleLowerCase()
    } else {
      toast({ toastType: 'warning', title: 'Unsupported chain type.' })
      router.go(-1)
      return { token1: ref(''), token2: ref(''), chain: ref('') }
    }
  }

  if (protocol.value === Protocol.Rune.toLocaleLowerCase()) {
    return { ...useRunesPool(), chain }
  } else {
    toast({ toastType: 'warning', title: 'Unsupported protocol type.' })
    router.go(-1)
  }

  return { token1: ref(''), token2: ref(''), chain: ref('') }
}
