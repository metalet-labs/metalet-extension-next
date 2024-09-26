import { ref } from 'vue'
import { computedEager } from '@vueuse/core'
import { createGlobalState } from '@vueuse/core'

export const useOngoingTask = createGlobalState(() => {
  const buildId = ref('')

  const hasOngoing = computedEager(() => !!buildId.value)

  const pushOngoing = (id: string) => {
    buildId.value = id
  }

  const clearOngoing = () => {
    buildId.value = ''
  }

  return {
    buildId,
    hasOngoing,
    pushOngoing,
    clearOngoing,
  }
})
