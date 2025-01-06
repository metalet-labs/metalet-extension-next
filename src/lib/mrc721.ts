import { Chain } from '@metalet/utxo-wallet-service'
import { network } from './network'
import { metaletApiV4 } from '@/queries/request'
import { PageResult } from '@/queries/types'

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

export async function getMRC721ItemInfo(pinId: string): Promise<MRC721Item> {
  const net = network.value
  return await metaletApiV4<MRC721Item>('/man/mrc721/item-info').get({
    net,
    pinId,
  })
}

export async function getMRC721CollectionInfo(pinId: string): Promise<MRC721Collection> {
  const net = network.value
  return await metaletApiV4<MRC721Collection>('/man/mrc721/collection-info').get({
    net,
    pinId,
  })
}

export async function fetchMRC721Collections(
  address: string,
  cursor?: string,
  size = 10
): Promise<PageResult<MRC721Collection>> {
  const net = network.value
  return await metaletApiV4<PageResult<MRC721Collection>>('/man/mrc721/address/collection-list').get({
    net,
    address,
    cursor,
    size,
  })
}

export async function fetchMRC721CollectionItems(
  address: string,
  pinId: string,
  cursor?: string,
  size = 10
): Promise<PageResult<MRC721Item>> {
  const net = network.value
  return await metaletApiV4<PageResult<MRC721Item>>('/man/mrc721/address/collection/item-list').get({
    net,
    address,
    pinId,
    cursor,
    size,
  })
}
