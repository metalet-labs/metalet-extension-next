import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

const usePasswordStore = createGlobalState(() => {
  const password = ref('')

  const setPassword = (newPassword: string) => {
    password.value = newPassword
  }

  return {
    password,
    setPassword,
  }
})

export default usePasswordStore
