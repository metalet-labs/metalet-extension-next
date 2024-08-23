import { octopusApi } from './request'
import { useQuery } from '@tanstack/vue-query'
import { bridgeAssetPairReturnType } from './types/bridge'

export const getBridgePairInfo = async (): Promise<bridgeAssetPairReturnType> => {
  return await octopusApi<bridgeAssetPairReturnType>('/assetList').get()
}

export async function createPrepayOrderMintBtc(data: any) {
  return await octopusApi<any>('/createPrepayOrderMintBtc').post(data)
}

export async function createPrepayOrderMintMrc20(data: any) {
  return await octopusApi<any>('/createPrepayOrderMintMrc20').post(data)
}

export async function submitPrepayOrderMintBtc(data: any) {
  return await octopusApi<any>('/submitPrepayOrderMintBtc').post(data)
}

export async function submitPrepayOrderMintMrc20(data: any) {
  return await octopusApi<any>('/submitPrepayOrderMintMrc20').post(data)
}

export const useBridgeInfoQuery = () => {
  return useQuery({
    queryKey: ['BridgePairList'],
    queryFn: () => getBridgePairInfo(),
  })
}
