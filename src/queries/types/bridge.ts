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
  mvcPrice: number
  confirmSequence: number[][]
  feeBtc: number
  feeMvc: number
  net: string
  transactionSize: {
    BRC20_MINT: number
    BRC20_REDEEM: number
    BTC_MINT: number
    BTC_REDEEM: number
    RUNES_MINT: number
    RUNES_REDEEM: number
  }
}
