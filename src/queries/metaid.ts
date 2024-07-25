import { Ref, ComputedRef } from 'vue'
import { getNet } from '@/lib/network'
import { metaletApiV3 } from './request'
import { useQuery } from '@tanstack/vue-query'

export async function getMetaidInfo(address: string): Promise<{
  name: string
  avatar: string
}> {
  const net = getNet()
  return await metaletApiV3<{
    name: string
    avatar: string
  }>('/address/metaid/info').get({
    net,
    address,
  })
}

export const useMetaidInfoQuery = (address: Ref<string>, options: { enabled: ComputedRef<boolean> }) => {
  return useQuery({
    queryKey: ['Metaid Info', { address }],
    queryFn: () => getMetaidInfo(address.value),
    ...options,
  })
}
