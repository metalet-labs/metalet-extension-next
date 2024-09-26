import { ComputedRef, Ref } from 'vue'
import { swapBRC20Api } from '../request'
import { useQuery } from '@tanstack/vue-query'
import { POOL_QUERY_INTERVAL } from '../constants'

interface PoolStatus {
  token1: string
  token2: string
  token1Pool: number
  token2Pool: number
  token2PoolConfirmed: number
  poolEquity: string

  token1ServiceAddress: string
  token2ServiceAddress: string
  token1ServicePubkey: string
  token2ServicePubkey: string
  token1PerToken2: string
  token2PerToken1: string
  token1PerToken2UsingBtcUnit: string
  token2PerToken1UsingBtcUnit: string

  addressEquityOverall: string
  addressEquityAvailable: string
  addressEquityPending: string

  poolShareAvailable: string
  poolSharePending: string
  token1AmountAvailable: string
  token2AmountAvailable: string
  token1AmountPending: string
  token2AmountPending: string
  token1AmountUsingBtcUnitAvailable: string
  token1AmountUsingBtcUnitPending: string
}

export const getPoolStatus = async ({
  token1,
  token2,
  address,
}: {
  token1: string
  token2: string
  address: string
}): Promise<PoolStatus> => {
  return await swapBRC20Api<PoolStatus>(`/pools/${token1}-${token2}`).get({ address })
}

export const usePoolStatusQuery = (
  address: Ref<string>,
  token1: Ref<string>,
  token2: Ref<string>,
  enabled: ComputedRef<boolean>
) =>
  useQuery({
    queryKey: ['runesPoolStatus', { address, token1, token2 }],
    queryFn: () =>
      getPoolStatus({
        address: address.value,
        token1: token1.value,
        token2: token2.value,
      }),
    enabled,
    refetchInterval: POOL_QUERY_INTERVAL,
  })
