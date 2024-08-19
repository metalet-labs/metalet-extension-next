import { ref } from 'vue'
import useBTCPool from './useBTCPool'
import { useRouter } from 'vue-router'
import { toast } from '@/components/ui/toast'
import { useRouteParams } from '@vueuse/router'

const router = useRouter()

export default function useBridgePool() {
  const protocol = useRouteParams<string>('protocol')
  console.log('protocol', protocol.value)

  if (!protocol.value) {
    protocol.value = 'BTC'
  }

  if (protocol.value === 'BTC') {
    return { ...useBTCPool(), protocol }
  } else {
    toast({ toastType: 'warning', title: 'Unsupported protocol type.' })
    // FIXME: go undefined
    router.go(-1)
  }

  return { token1: ref(''), token2: ref(''), protocol }
}
