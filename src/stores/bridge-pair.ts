import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { type assetReqReturnType } from '@/queries/bridge-api'

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
