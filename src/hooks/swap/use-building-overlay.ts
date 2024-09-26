import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export const useBuildingOverlay = createGlobalState(() => {
  // state
  const isBuilding = ref(false)

  // actions
  const openBuilding = () => {
    isBuilding.value = true
  }

  const closeBuilding = () => {
    isBuilding.value = false
  }

  return {
    isBuilding,
    openBuilding,
    closeBuilding,
  }
})
