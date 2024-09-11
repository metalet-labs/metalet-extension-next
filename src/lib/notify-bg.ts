import { IS_DEV } from '@/data/config'
import usePasswordStore from '@/stores/PasswordStore'

interface EmitParams {
  args: unknown[]
  eventName: string
}

async function emit(params: EmitParams) {
  if (IS_DEV) {
    return
  }

  try {
    return window.browser.runtime.sendMessage({ ...params, channel: 'to-bg' })
  } catch {
    const { password } = usePasswordStore()
    return password.value
  }
}

export function notifyBg(eventName: string) {
  return (...args: unknown[]) => emit({ eventName, args })
}
