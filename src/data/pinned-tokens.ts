import { network } from '@/lib/network'

export const livenetOrderbookTokens = ['RDEX', 'rats', 'ordi', 'sats', 'BTCs']
export const testnetOrderbookTokens = ['xedr', 'okok']

export const livenetSwapTokens = ['RDEX', 'rats']
export const testnetSwapTokens = ['xedr', 'dexr']

export type RuneToken = {
  rune: string
  runeid: string
  amount: string
  divisibility: number
  symbol: string
  spacedRune: string
}
export const testnetRuneTokens = [
  {
    rune: 'TRILLIONDOLLARMEMECOIN',
    runeid: '2585790:43',
    amount: '10500000',
    divisibility: 0,
    symbol: '𖭡',
    spacedRune: 'TRILLION•DOLLAR•MEMECOIN',
  },
]
export const livenetRuneTokens = [
  {
    runeid: '1:0',
    rune: 'UNCOMMONGOODS',
    amount: '1',
    divisibility: 0,
    symbol: '⧉',
    spacedRune: 'UNCOMMON•GOODS',
  },
  {
    runeid: '840010:93',
    rune: 'THEGODOFBITCOIN',
    amount: '1',
    divisibility: 0,
    symbol: '👁',
    spacedRune: 'THE•GOD•OF•BITCOIN',
  },
]

export const swapTokens = network.value === 'testnet' ? testnetSwapTokens : livenetSwapTokens

export const runeTokens = network.value === 'testnet' ? testnetRuneTokens : livenetRuneTokens
