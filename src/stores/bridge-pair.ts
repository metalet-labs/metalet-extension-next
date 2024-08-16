import { createGlobalState } from '@vueuse/core'
import { type assetReqReturnType } from '@/queries/bridge-api'
import { ref } from 'vue'
// type bridgePairInfo={
//     network: string,
//     targetSymbol: string,
//     originSymbol: string,
//     id: number,
// }

export const useBridgePairStore = createGlobalState(() => {
  const list = ref<assetReqReturnType[]>([])

  const get = () => list.value

  const set = (newList: assetReqReturnType[]) => {
    list.value = newList
  }

  return {
    list,
    get,
    set,
  }
})
