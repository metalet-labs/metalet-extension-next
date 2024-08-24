import { bridgeApiFetch } from '@/lib/fetch'

export type assetReqReturnType = {
  decimals: number
  feeRateConstMint: number
  feeRateConstRedeem: number
  feeRateNumeratorMint: number
  feeRateNumeratorRedeem: number
  isEnableMint: boolean
  isEnableRedeem: boolean
  network: string
  originName: string
  originSymbol: string
  originTokenId: string
  price: number
  targetName: string
  targetSymbol: string
  targetTokenCodeHash: string
  targetTokenGenesis: string
  targetTokenId: string
  trimDecimals: number
}

export type bridgeAssetPairReturnType = {
  amountLimitMaximum: string
  amountLimitMinimum: string
  assetList: assetReqReturnType[]
  btcPrice: number
  confirmSequence: number[][]
  feeBtc: number
  feeMvc: number
  net: string
  transactionSize: {
    BRC20_MINT: number
    BRC20_REDEEM: number
    BTC_MINT: number
    BTC_REDEEM: number
  }
}

export const getAssetPairList = async (): Promise<bridgeAssetPairReturnType> => {
  return await bridgeApiFetch(`/assetList`, {
    method: 'GET',
  })
}

export const createPrepayOrderMintBtcReq = async (data: any) => {
  return await bridgeApiFetch(`/createPrepayOrderMintBtc`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const createPrepayOrderMintBrc20Req = async (data: any) => {
  return await bridgeApiFetch(`/createPrepayOrderMintBrc20`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const createPrepayOrderMintRunesReq = async (data: any) => {
  return await bridgeApiFetch(`/createPrepayOrderMintRunes`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const createPrepayOrderRedeemRunes = async (data: any) => {
  return await bridgeApiFetch(`/createPrepayOrderRedeemRunes`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const submitPrepayOrderMintBtcReq = async (
  data: any
): Promise<{
  msg: string
  success: boolean
}> => {
  return await bridgeApiFetch(`/submitPrepayOrderMintBtc`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const submitPrepayOrderMintBrc20Req = async (
  data: any
): Promise<{
  msg: string
  success: boolean
}> => {
  return await bridgeApiFetch(`/submitPrepayOrderMintBrc20`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const submitPrepayOrderMintRunesReq = async (
  data: any
): Promise<{
  msg: string
  success: boolean
}> => {
  return await bridgeApiFetch(`/submitPrepayOrderMintRunes`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const submitPrepayOrderRedeemRunes = async (
  data: any
): Promise<{
  msg: string
  success: boolean
}> => {
  return await bridgeApiFetch(`/submitPrepayOrderRedeemRunes`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const createPrepayOrderRedeemBtc = async (data: any) => {
  return await bridgeApiFetch(`/createPrepayOrderRedeemBtc`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const submitPrepayOrderRedeemBtc = async (data: any): Promise<{ success: boolean; msg: string }> => {
  return await bridgeApiFetch(`/submitPrepayOrderRedeemBtc`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const createPrepayOrderRedeemBrc20 = async (data: any) => {
  return await bridgeApiFetch(`/createPrepayOrderRedeemBrc20`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const submitPrepayOrderRedeemBrc20 = async (data: any): Promise<{ success: boolean; msg: string }> => {
  return await bridgeApiFetch(`/submitPrepayOrderRedeemBrc20`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export type TxType = 'btcToMvc' | 'brc20ToMvc' | 'mvcToBtc' | 'mvcToBrc20'
export type HistoryParams = {
  type: TxType
  cursor: number
  size: number
  order: 'asc' | 'desc'
  address: string
}

export enum PrepayOrderStatus {
  doing = 'doing',
  success = 'success',
  cancel = 'cancel',
  failed = 'failed',
}
export type HsitoryDetail = {
  amount: string
  timestamp: string
  status: PrepayOrderStatus
  symbol: string
  originTxid: string
  targetTxid: string
  originNetwork: 'BTC' | 'MVC'
  targetNetwork: 'BTC' | 'MVC'
  decimals: number
  blockHeight: number
  name: string
}
export const getBridgeHistory = async ({
  type,
  cursor,
  size,
  order,
  address,
}: HistoryParams): Promise<{
  totalCount: number
  txList: HsitoryDetail[]
}> => {
  return await bridgeApiFetch(
    `/query/queryTransactionsByAddress?type=${type}&cursor=${cursor}&size=${size}&order=${order}&address=${address}`,
    {
      method: 'GET',
    }
  )
}
