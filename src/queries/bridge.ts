import { Ref } from 'vue'
import { octopusApi } from './request'
import { useQuery } from '@tanstack/vue-query'
import { CoinCategory } from './exchange-rates'
import { bridgeAssetPairReturnType } from './types/bridge'

export const getBridgePairInfo = async (): Promise<bridgeAssetPairReturnType> => {
  return await octopusApi<bridgeAssetPairReturnType>('/assetList').get()
}

export const useBridgeInfoQuery = (coinCategory: Ref<CoinCategory>) => {
  return useQuery({
    queryKey: ['BridgePairList'],
    queryFn: () => getBridgePairInfo(),
    select: (data) => {
      if (coinCategory.value === CoinCategory.Native) {
        data.assetList = data.assetList.filter((item) => item.network === 'BTC')
        return data
      } else if (coinCategory.value === CoinCategory.MRC20) {
        data.assetList = data.assetList.filter((item) => item.network === 'MRC20')
        return data
      } else if (coinCategory.value === CoinCategory.Rune) {
        data.assetList = data.assetList.filter((item) => item.network === 'RUNES')
        return data
      } else if (coinCategory.value === CoinCategory.BRC20) {
        data.assetList = data.assetList.filter((item) => item.network === 'BRC20')
        return data
      }
    },
  })
}
