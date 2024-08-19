import { InjectionKey } from 'vue'
import { ref, Ref } from 'vue'
import { type assetReqReturnType } from '@/queries/types/bridge'
import { useBridgePairStore } from '@/stores/bridge-pair'
const bridgePairStore = useBridgePairStore()

console.log('bridgePairStore', bridgePairStore.list)

const bridgePairs: Ref<assetReqReturnType[]> = ref(bridgePairStore.list)

export default bridgePairs

export type BridgePair = (typeof bridgePairs.value)[0]

export const defaultPair = bridgePairs.value[0] || {
  network: 'BTC',
  targetSymbol: 'BTC',
  originSymbol: 'BTC',
  id: 1,
}

export const selectPair = (pairRaw?: string) => {
  const pairSymbols = (pairRaw || 'BTC-TBTC').split('-')
  return (
    bridgePairs.value.find((pair) => pair.originSymbol === pairSymbols[0] && pair.targetSymbol === pairSymbols[1]) ||
    bridgePairs.value[0]
  )
}

export const getPairs = (bridgePairList: assetReqReturnType[]) => {
  const bridgePairStore = useBridgePairStore()
  const pariList = bridgePairList.map((item, id) => {
    return {
      id: id + 1,
      ...item,
    }
  })
  if (bridgePairStore.list.value.length !== pariList.length) {
    bridgePairStore.set(pariList)
  }
  bridgePairs.value = pariList
}

export const selectedPairKey = Symbol() as InjectionKey<BridgePair>
export const selectedPoolPairKey = Symbol() as InjectionKey<BridgePair>
