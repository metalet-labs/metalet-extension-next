import { TokenTransfer } from '@/queries/brc20'
import { SymbolTicker } from '@/lib/asset-symbol'
import { Balance, BRC20Balance } from '@/queries/types/balance'

export interface Asset {
  symbol: SymbolTicker
  tokenName: string
  isNative: boolean
  chain: 'btc' | 'mvc'
  queryable: boolean
  decimal: number
  balance?: Balance
  contract?: string
}

export interface BRC20Asset extends Asset {
  balance: BRC20Balance
  transferableList?: TokenTransfer[]
}

export interface FTAsset extends Asset {
  genesis: string
  codeHash: string
}

export interface RuneAsset extends Asset {
  runeId: string
  mintable: boolean
  remainingMint: string
}

export interface Tag {
  name: string
  bg: string
  color: string
}

const tags: Tag[] = [
  {
    name: 'BTC',
    bg: '#F7931A',
    color: '#ffffff',
  },
  {
    name: 'BRC-20',
    bg: 'rgb(247, 147, 26, 0.2)',
    color: '#FF981C',
  },
  {
    name: 'MVC',
    bg: '#767EFF',
    color: '#ffffff',
  },
  {
    name: 'MetaContract',
    bg: 'rgba(153,159,255,0.2)',
    color: '#787FFF',
  },
]

function getTagInfo(name: string): Tag | undefined {
  return tags.find((tag) => tag.name === name)
}

function getTags(asset: Asset): Tag[] {
  const tagList: Tag[] = []
  if (asset?.contract) {
    const contractTag = getTagInfo(asset.contract)
    if (contractTag) {
      tagList.push(contractTag)
    }
  } else if ((asset as RuneAsset)?.runeId) {
    ;[
      {
        name: 'Runes',
        bg: 'rgb(247, 147, 26, 0.2)',
        color: '#FF981C',
      },
    ]
  }
  return tagList
}

const BTCAsset: Asset = {
  symbol: 'BTC',
  tokenName: 'BTC',
  isNative: true,
  chain: 'btc',
  queryable: true,
  decimal: 8,
}

const MVCAsset: Asset = {
  symbol: 'SPACE',
  tokenName: 'SPACE',
  isNative: true,
  chain: 'mvc',
  queryable: true,
  decimal: 8,
}

const allAssets = [BTCAsset, MVCAsset]

export { BTCAsset, MVCAsset, allAssets, getTags, getTagInfo }
