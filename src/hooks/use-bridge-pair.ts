import { type Ref, computed, ref } from 'vue'
import { useRouteParams } from '@vueuse/router'
import { useRouter } from 'vue-router'
import bridgePairs from '@/data/bridge-pairs'

export function useBridgePair() {
  const router = useRouter()
  
  
  if(!bridgePairs.value.length){

  }
  const selectedPairId = ref(bridgePairs.value[0].id)
  
  const selectedPair = computed(() => {
    const pair = bridgePairs.value.find((a) => a.id === selectedPairId.value)
    if (pair) {
      return pair
    }

    throw new Error('Pair not found')
  })

  const defaultPairStr = `${bridgePairs.value[0].originSymbol}-${bridgePairs.value[0].targetSymbol}`
  const pairStr = useRouteParams('pair', defaultPairStr) as Ref<string>
  const fromSymbol = computed(() => pairStr.value.split('-')[0])
  let toSymbol:any
  if(pairStr.value.split('-').length > 2){
    toSymbol= computed(() => `${pairStr.value.split(/\-/)[1]}-${pairStr.value.split(/\-/)[2]}`)
}else{
  toSymbol= computed(() => pairStr.value.split(/\-/)[1])
}
 
  

  const selected = bridgePairs.value.find(
    (a) =>
      a.originName === fromSymbol.value &&
      a.targetName === toSymbol.value,
  )
  if (selected) {
    selectedPairId.value = selected.id
  }

  function selectBridgePair(id: number) {
    
    selectedPairId.value = id
   
    // redirect
    const pair = bridgePairs.value.find((pair) => pair.id === id)
    if (pair) {
      
      const pairSymbol = `${pair.originName}-${pair.targetName}`
      
      router.push({
        path: `/bridge/${pairSymbol}`,
      })
    }
  }

  return {
    pairStr,
    selectedPairId,
    selectedPair,
    selectBridgePair,
    fromSymbol,
    toSymbol,
  }
}
