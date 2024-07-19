import useStorage from './storage'
import { SymbolTicker } from './asset-symbol'
import { CoinCategory } from '@/queries/exchange-rates'

const storage = useStorage()

const ASSET_MANAGE = 'ASSET_MANAGE'

interface AssetManageObj {
  [address: string]: {
    [coinCategory in CoinCategory]?: {
      [symbol: SymbolTicker]: boolean
    }
  }
}

const getAssetManageObj = async () => {
  return await storage.get<AssetManageObj>(ASSET_MANAGE, {
    defaultValue: {},
  })
}

const setAssetManageObj = async (assetManageObj: AssetManageObj) => {
  await storage.set(ASSET_MANAGE, assetManageObj)
}

export const getAssetManageList = async (address: string) => {
  const assetManageObj = await getAssetManageObj()
  return Object.entries(assetManageObj[address] || {}).flatMap(([coinCategory, symbols]) =>
    Object.entries(symbols)
      .filter(([_, value]) => !value)
      .map(([symbol, _]) => `${coinCategory}-${symbol}`)
  )
}

export const setAssetManage = async (
  address: string,
  coinCategory: CoinCategory,
  symbol: SymbolTicker,
  isOpen: boolean
) => {
  const assetManageObj = await getAssetManageObj()

  // Ensure the address object exists
  if (!assetManageObj[address]) {
    assetManageObj[address] = {}
  }

  // Ensure the coinCategory object exists
  if (!assetManageObj[address][coinCategory]) {
    assetManageObj[address][coinCategory] = {}
  }

  // Set the symbol value
  assetManageObj[address][coinCategory]![symbol] = isOpen

  await setAssetManageObj(assetManageObj)
}
