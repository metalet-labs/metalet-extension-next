import { Chain } from '@metalet/utxo-wallet-service'
import { network } from './network'

export interface MRC721Collection {
  collectionName: string
  name: string
  totalSupply: number
  royaltyRate: number
  desc: string
  website: string
  cover: string
  metadata: string
  pinId: string
  address: string
  metaId: string
  createTime: number
  totalNum: number
}

export interface MRC721Item {
  collectionPinId: string
  collectionName: string
  itemPinId: string
  itemPinNumber: number
  descPinId: string
  name: string
  desc: string
  cover: string
  metaData: string
  createTime: number
  address: string
  content: string
  metaId: string
  descadded: boolean
  contentType: string
  contentTypeDetect: string
  contentString: string
  outpoint: string
  outValue: number
  chain: Chain
  popLv: number
}

export function getMetaFileUrl(metafile: string) {
  if (metafile.startsWith('/content')) {
    return `https://man${network.value === 'testnet' ? '-test' : ''}.metaid.io${metafile}`
  }
  if (!metafile?.startsWith('metafile://')) return metafile
  const fileId = metafile.replace('metafile://', '')
  return `https://man${network.value === 'testnet' ? '-test' : ''}.metaid.io/content/${fileId}`
}
