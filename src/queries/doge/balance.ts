/**
 * DOGE Balance Query Functions
 */

import Decimal from 'decimal.js'
import { Ref, ComputedRef } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getNet } from '@/lib/network'
import { metaletApiV4 } from '@/queries/request'
import { Balance_QUERY_INTERVAL } from '@/queries/constants'
import { DogeBalance, DogeBalanceResult } from './types'

/**
 * Fetch DOGE balance for an address
 * Uses the /v4/doge/address/balance-info endpoint
 */
export async function fetchDogeBalance(address: string): Promise<DogeBalanceResult> {
  const net = getNet()
  
  const data = await metaletApiV4<DogeBalance>('/doge/address/balance-info', {
    withCredential: false,
  }).get({
    net,
    address,
  })

  return {
    total: new Decimal(data.confirmed + data.unconfirmed),
    confirmed: new Decimal(data.confirmed),
    unconfirmed: new Decimal(data.unconfirmed),
  }
}

/**
 * Vue Query hook for DOGE balance
 */
export const useDogeBalanceQuery = (
  address: Ref<string>,
  options?: {
    enabled?: ComputedRef<boolean>
  }
) => {
  return useQuery({
    queryKey: ['DOGE Balance', { address }],
    queryFn: () => fetchDogeBalance(address.value),
    refetchInterval: Balance_QUERY_INTERVAL,
    ...options,
  })
}
