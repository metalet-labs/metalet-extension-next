import { octopusApi, octopusApiOuter } from './request'
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

export async function createPrepayOrderRedeemBtc(data: any) {
  return await octopusApi<any>('/createPrepayOrderRedeemBtc').post(data)
}

export async function createPrepayOrderRedeemMrc20(data: any) {
  return await octopusApi<any>('/createPrepayOrderRedeemMrc20').post(data)
}

export async function submitPrepayOrderMintBtc(data: any) {
  return await octopusApi<any>('/submitPrepayOrderMintBtc').post(data)
}

export async function submitPrepayOrderMintMrc20(data: any) {
  return await octopusApi<any>('/submitPrepayOrderMintMrc20').post(data)
}

export async function submitPrepayOrderRedeemBtc(data: any) {
  return await octopusApi<any>('/submitPrepayOrderRedeemBtc').post(data)
}

export async function submitPrepayOrderRedeemMrc20(data: any) {
  return await octopusApi<any>('/submitPrepayOrderRedeemMrc20').post(data)
}

export const useBridgeInfoQuery = () => {
  return useQuery({
    queryKey: ['BridgePairList'],
    queryFn: () => getBridgePairInfo(),
  })
}

export async function getBridgeHistory(params: {
  type: string
  cursor: string
  size: string
  order: string
  address: string
}) {
  return await octopusApiOuter<any>('/queryTransactionsByAddress').get(params)
}
