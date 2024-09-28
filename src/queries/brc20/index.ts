import { network } from '@/lib/network'
import { orderCommonApi } from '../request'
import { useQuery } from '@tanstack/vue-query'
import { Ref, ComputedRef, computed } from 'vue'

export type BRC20Token = {
  creator: string
  decimal: string
  deployBlockTime: number
  deployHeight: number
  historyCount: number
  holdersCount: number
  inscriptionId: string
  inscriptionNumber: number
  limit: string
  max: string
  mintTimes: number
  minted: string
  ticker: string
  totalMinted: string
  txId: string
}

const getBRC20Tokens = async ({ keyword }: { keyword: string }): Promise<BRC20Token[]> => {
  const {
    data: { list },
  } = await orderCommonApi<{ data: { list: BRC20Token[] } }>(`/brc20/tick/list`).get({
    net: network.value,
    size: '5',
    tick: keyword,
  })

  return list
}

export const useBRC20TokensQuery = (
  filters: {
    keyword: Ref<string>
  },
  enabled: ComputedRef<boolean> = computed(() => true)
) =>
  useQuery({
    queryKey: ['brc20Tokens', filters],
    queryFn: () => getBRC20Tokens({ keyword: filters.keyword.value }),

    enabled,
  })
