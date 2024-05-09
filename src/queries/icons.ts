import { Chain } from '@/lib/types'
import { ComputedRef, ref } from 'vue'
import { metaletApiV3 } from './request'
import { useQuery } from '@tanstack/vue-query'
import { CoinCategory } from './exchange-rates'

interface IconResult {
  brc20_coin: Record<string, string>
  ft_coin: Record<string, string>
}

// const icons = ref<IconResult>(await metaletApiV3<IconResult>(`/coin/icons`).get())
const icons = ref<IconResult>()

export const getIcon = (chain: Chain, name: string): string => {
  if (icons.value) {
    if (chain === 'btc') {
      return icons.value['brc20_coin'][name]
    } else if (chain === 'mvc') {
      return icons.value['ft_coin'][name]
    }
  }
  return ''
}

export interface Icons {
  [coinCategory: string]: {
    [coinSymbol: string]: string
  }
}

export async function getIcons(): Promise<Icons> {
  return await metaletApiV3<Icons>('/coin/icons').get()
}
