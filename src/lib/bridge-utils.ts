import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import BigNumber from 'bignumber.js'
import { getBtcUtxos } from '@/queries/utxos'
import {
  createPrepayOrderMintBtc,
  createPrepayOrderMintMrc20,
  createPrepayOrderRedeemBtc,
  createPrepayOrderRedeemMrc20,
  submitPrepayOrderMintBtc,
  submitPrepayOrderMintMrc20,
  submitPrepayOrderRedeemBtc,
  submitPrepayOrderRedeemMrc20,
} from '@/queries/bridge'
import { assetReqReturnType, bridgeAssetPairReturnType } from '@/queries/types/bridge'
import { BtcWallet, MvcWallet, ScriptType, SignType } from '@metalet/utxo-wallet-service'
import { getMRC20Utxos } from '@/queries/mrc20'
import { process as sendToken } from '@/lib/actions/transfer'
import { sleep } from './helpers'
export const formatSat = (value: string | number, dec = 8) => {
  if (!value) return '0'

  const v = BigNumber(value).div(Math.pow(10, dec))
  const arr = v.toString().split('.')
  if (v.toString().indexOf('e') > -1 || (arr[1] && arr[1].length > dec)) {
    return BigNumber(v).toFixed(dec)
  }
  return v.toString()
}

export function amountRaw(amount: string, decimals: number, maxValue?: BigNumber | bigint | string) {
  const _amountRaw = new BigNumber(amount).multipliedBy(Math.pow(10, decimals))
  if (maxValue) {
    const _maxValue = new BigNumber(maxValue.toString()).multipliedBy(9999999).div(10000000)
    if (_amountRaw.gte(_maxValue)) {
      return maxValue.toString()
    }
  }
  return _amountRaw.toFixed(0)
}

const confirmNumberBySeqAndAmount = function (
  amount: number,
  seq: number[][],
  network: 'BTC' | 'BRC20' | 'RUNES' | 'MVC' | 'MRC20'
) {
  for (const item of seq) {
    const [start, end, confirmBtc, confirmMvc] = item
    if (end) {
      if (start <= amount && amount <= end) {
        if (network === 'MVC') {
          return confirmMvc
        } else {
          return confirmBtc
        }
      }
    } else {
      if (start <= amount) {
        if (network === 'MVC') {
          return confirmMvc
        } else {
          return confirmBtc
        }
      }
    }
  }
  return 5
}

export type FeeInfo = {
  receiveAmount: number | string
  minerFee: number | string
  bridgeFee: number | string
  totalFee: number | string
  confirmNumber: number | string
}
export const calcRedeemBtcInfo = (redeemAmount: number, assetInfo: bridgeAssetPairReturnType): FeeInfo => {
  const { feeBtc, amountLimitMaximum, amountLimitMinimum, confirmSequence, transactionSize, assetList } = assetInfo
  if (redeemAmount < Number(amountLimitMinimum)) {
    throw new Error('amount less than minimum amount')
  }
  if (redeemAmount > Number(amountLimitMaximum)) {
    throw new Error('amount greater than maximum amount')
  }
  const confirmNumber = confirmNumberBySeqAndAmount(
    redeemAmount,
    confirmSequence,
    // mint btc -> mvc, get mvc confirm number
    'MVC'
  )
  const btcAsset = assetList.find((item) => item.network === 'BTC')
  if (!btcAsset) throw new Error('no assrt')
  const bridgeFee = (redeemAmount * btcAsset.feeRateNumeratorRedeem) / 10000 + btcAsset.feeRateConstRedeem
  const minerFee = transactionSize.BTC_REDEEM * feeBtc
  const totalFee = Math.floor(bridgeFee + minerFee)
  const receiveAmount = redeemAmount - totalFee
  return {
    receiveAmount: formatSat(receiveAmount),
    minerFee: formatSat(minerFee),
    bridgeFee: formatSat(bridgeFee),
    totalFee: formatSat(totalFee),
    confirmNumber,
  }
}

export const calcRedeemBrc20Info = (
  redeemAmount: number,
  assetInfo: bridgeAssetPairReturnType,
  asset: assetReqReturnType
): FeeInfo => {
  const { btcPrice, feeBtc, amountLimitMaximum, amountLimitMinimum, confirmSequence, transactionSize } = assetInfo

  const brcAmount = redeemAmount / 10 ** (asset.decimals - asset.trimDecimals)
  const redeemBrc20EqualBtcAmount = ((asset.price * Number(brcAmount)) / btcPrice) * 10 ** 8

  if (redeemBrc20EqualBtcAmount < Number(amountLimitMinimum)) {
    throw new Error('amount less than minimum amount')
  }
  if (redeemBrc20EqualBtcAmount > Number(amountLimitMaximum)) {
    throw new Error('amount greater than maximum amount')
  }

  const confirmNumber = confirmNumberBySeqAndAmount(
    redeemBrc20EqualBtcAmount,
    confirmSequence,
    // mint btc -> mvc, get mvc confirm number
    'MVC'
  )
  const bridgeFeeConst = BigInt(
    Math.floor(
      (((asset.feeRateConstRedeem / 10 ** 8) * btcPrice) / asset.price) * 10 ** (asset.decimals - asset.trimDecimals)
    )
  )
  const bridgeFeePercent = (BigInt(redeemAmount) * BigInt(asset.feeRateNumeratorRedeem)) / 10000n
  const bridgeFee = bridgeFeeConst + bridgeFeePercent
  const minerFee = BigInt(
    Math.floor(
      (((transactionSize.BRC20_REDEEM / 10 ** 8) * feeBtc * btcPrice) / asset.price) *
        10 ** (asset.decimals - asset.trimDecimals)
    )
  )
  const totalFee = bridgeFee + minerFee
  const receiveAmount = BigInt(redeemAmount) - totalFee
  return {
    receiveAmount: formatSat(String(receiveAmount), asset.decimals - asset.trimDecimals),
    minerFee: formatSat(String(minerFee), asset.decimals - asset.trimDecimals),
    bridgeFee: formatSat(String(bridgeFee), asset.decimals - asset.trimDecimals),
    totalFee: formatSat(String(totalFee), asset.decimals - asset.trimDecimals),
    confirmNumber,
  }
}

export const calcMintBtcInfo = (mintAmount: number, assetInfo: bridgeAssetPairReturnType): FeeInfo => {
  const {
    btcPrice,
    mvcPrice,
    feeBtc,
    feeMvc,
    amountLimitMaximum,
    amountLimitMinimum,
    confirmSequence,
    transactionSize,
    assetList,
  } = assetInfo

  if (mintAmount < Number(amountLimitMinimum)) {
    throw new Error('amount less than minimum amount')
  }
  if (mintAmount > Number(amountLimitMaximum)) {
    throw new Error('amount greater than maximum amount')
  }
  const confirmNumber = confirmNumberBySeqAndAmount(
    mintAmount,
    confirmSequence,
    // mint btc -> mvc, get mvc confirm number
    'BTC'
  )
  const btcAsset = assetList.find((item) => item.network === 'BTC')
  if (!btcAsset) throw new Error('no asset')
  let bridgeFee: number = 0
  let minerFee: number = 0
  if (btcAsset.feeRateNumeratorMint > 0 || btcAsset.feeRateConstMint > 0) {
    bridgeFee = (mintAmount * btcAsset.feeRateNumeratorMint) / 10000 + btcAsset.feeRateConstMint
    minerFee = (transactionSize.BTC_MINT * feeMvc * mvcPrice) / btcPrice
  }
  const totalFee = Math.floor(bridgeFee + minerFee)
  const receiveAmount = mintAmount - totalFee

  return {
    receiveAmount: formatSat(receiveAmount),
    minerFee: formatSat(minerFee),
    bridgeFee: formatSat(bridgeFee),
    totalFee: formatSat(totalFee),
    confirmNumber,
  }
}

export const calcMintBtcRange = (assetInfo: bridgeAssetPairReturnType) => {
  const { amountLimitMaximum, amountLimitMinimum } = assetInfo
  return [Number(formatSat(amountLimitMinimum)), Number(formatSat(amountLimitMaximum))]
}

export const calcRedeemBtcRange = (assetInfo: bridgeAssetPairReturnType) => {
  const { amountLimitMaximum, amountLimitMinimum } = assetInfo
  return [Number(formatSat(amountLimitMinimum)), Number(formatSat(amountLimitMaximum))]
}

export const calcMintBrc20Info = (
  mintAmount: number,
  assetInfo: bridgeAssetPairReturnType,
  asset: assetReqReturnType
): FeeInfo => {
  const {
    btcPrice,
    mvcPrice,
    feeBtc,
    feeMvc,
    amountLimitMaximum,
    amountLimitMinimum,
    confirmSequence,
    transactionSize,
    assetList,
  } = assetInfo
  const assetRdex = asset
  const mintBrc20EqualBtcAmount = ((assetRdex.price * Number(mintAmount)) / btcPrice) * 10 ** 8
  if (Number(mintBrc20EqualBtcAmount) < Number(amountLimitMinimum)) {
    throw new Error('amount less than minimum amount')
  }
  if (Number(mintBrc20EqualBtcAmount) > Number(amountLimitMaximum)) {
    throw new Error('amount greater than maximum amount')
  }

  const confirmNumber = confirmNumberBySeqAndAmount(
    mintBrc20EqualBtcAmount,
    confirmSequence,
    // mint btc -> mvc, get mvc confirm number
    'BRC20'
  )
  let bridgeFee: number = 0
  let minerFee: number = 0
  if (assetRdex.feeRateNumeratorMint > 0 || assetRdex.feeRateConstMint > 0) {
    bridgeFee =
      (Number(mintAmount) * assetRdex.feeRateNumeratorMint) / 10000 +
      ((assetRdex.feeRateConstMint / 10 ** 8) * btcPrice) / assetRdex.price
    minerFee = (transactionSize.BTC_MINT * feeMvc * mvcPrice) / 10 ** 8 / assetRdex.price
  }
  const totalFee = bridgeFee + minerFee
  const receiveAmount = Number(mintAmount) - totalFee
  const receiveAmountFixed = receiveAmount.toFixed(assetRdex.decimals - assetRdex.trimDecimals)
  return {
    receiveAmount: receiveAmountFixed,
    minerFee,
    bridgeFee,
    totalFee,
    confirmNumber,
  }
}

export const calcPriceRange = (assetInfo: bridgeAssetPairReturnType, asset: assetReqReturnType) => {
  const { btcPrice, amountLimitMaximum, amountLimitMinimum } = assetInfo
  const assetRdex = asset
  const minAmount = ((Number(amountLimitMinimum) / 1e8) * btcPrice) / assetRdex.price
  const maxAmount = ((Number(amountLimitMaximum) / 1e8) * btcPrice) / assetRdex.price

  return {
    amountLimitMinimum: new Decimal(10).pow(asset.decimals).mul(minAmount).toString(),
    amountLimitMaximum: new Decimal(10).pow(asset.decimals).mul(maxAmount).toString(),
  }
}

export function determineAddressInfo(address: string): string {
  if (address.startsWith('bc1q')) {
    return 'p2wpkh'
  }
  if (address.startsWith('tb1q')) {
    return 'p2wpkh'
  }

  if (address.startsWith('bc1p')) {
    return 'p2tr'
  }

  if (address.startsWith('tb1p')) {
    return 'p2tr'
  }

  if (address.startsWith('1')) {
    return 'p2pkh'
  }
  if (address.startsWith('3') || address.startsWith('2')) {
    return 'p2sh'
  }
  if (address.startsWith('m') || address.startsWith('n')) {
    return 'p2pkh'
  }
  return 'unknown'
}

export function prettyTimestamp(timestamp: number, isInSeconds = false, cutThisYear = false) {
  if (isInSeconds) timestamp = timestamp * 1000

  if (cutThisYear) return dayjs(timestamp).format('MM-DD HH:mm:ss')

  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

export const formatUnitToSats = (value: number | string, decimal: number = 8) => {
  if (!value) {
    return 0
  }
  return new Decimal(value).mul(10 ** decimal).toNumber()
}

export const formatUnitToBtc = (value: number | string, decimal: number = 8) => {
  if (!value) {
    return 0
  }
  return new Decimal(value).div(10 ** decimal).toNumber()
}

export const calcMintRunesInfo = (
  mintAmount: number,
  assetInfo: bridgeAssetPairReturnType,
  asset: assetReqReturnType
): FeeInfo => {
  const {
    btcPrice,
    mvcPrice,
    feeBtc,
    feeMvc,
    amountLimitMaximum,
    amountLimitMinimum,
    confirmSequence,
    transactionSize,
    assetList,
  } = assetInfo

  // // 转换成btc价值
  const mintRunesEqualBtcAmount = ((asset.price * Number(mintAmount)) / btcPrice) * 10 ** 8
  console.log('mintRunesEqualBtcAmount:', mintRunesEqualBtcAmount)
  console.log('mintRunesEqualBtcAmount:', amountLimitMinimum, amountLimitMaximum)

  if (Number(mintRunesEqualBtcAmount) < Number(amountLimitMinimum)) {
    throw new Error('amount less than minimum amount')
  }
  if (Number(mintRunesEqualBtcAmount) > Number(amountLimitMaximum)) {
    throw new Error('amount greater than maximum amount')
  }

  const confirmNumber = confirmNumberBySeqAndAmount(
    mintRunesEqualBtcAmount,
    confirmSequence,
    // mint btc -> mvc, get mvc confirm number
    'RUNES'
  )
  let bridgeFee: number = 0
  let minerFee: number = 0
  if (asset.feeRateNumeratorMint > 0 || asset.feeRateConstMint > 0) {
    bridgeFee =
      (Number(mintAmount) * asset.feeRateNumeratorMint) / 10000 +
      ((asset.feeRateConstMint / 10 ** 8) * btcPrice) / asset.price
    minerFee = (transactionSize.BTC_MINT * feeMvc * mvcPrice) / 10 ** 8 / asset.price
  }
  const totalFee = bridgeFee + minerFee
  const receiveAmount = Number(mintAmount) - totalFee
  const receiveAmountFixed = receiveAmount.toFixed(asset.decimals - asset.trimDecimals)
  return {
    receiveAmount: receiveAmountFixed,
    minerFee,
    bridgeFee,
    totalFee,
    confirmNumber,
  }
}

export const calcRedeemRunesInfo = (
  redeemAmount: number,
  assetInfo: bridgeAssetPairReturnType,
  asset: assetReqReturnType
): FeeInfo => {
  const { btcPrice, feeBtc, amountLimitMaximum, amountLimitMinimum, confirmSequence, transactionSize } = assetInfo

  const runesAmount = redeemAmount / 10 ** (asset.decimals - asset.trimDecimals)
  const redeemBrc20EqualBtcAmount = ((asset.price * Number(runesAmount)) / btcPrice) * 10 ** 8

  if (redeemBrc20EqualBtcAmount < Number(amountLimitMinimum)) {
    throw new Error('amount less than minimum amount')
  }
  if (redeemBrc20EqualBtcAmount > Number(amountLimitMaximum)) {
    throw new Error('amount greater than maximum amount')
  }

  const confirmNumber = confirmNumberBySeqAndAmount(
    redeemBrc20EqualBtcAmount,
    confirmSequence,
    // mint btc -> mvc, get mvc confirm number
    'MVC'
  )
  const bridgeFeeConst = BigInt(
    Math.floor(
      (((asset.feeRateConstRedeem / 10 ** 8) * btcPrice) / asset.price) * 10 ** (asset.decimals - asset.trimDecimals)
    )
  )
  const bridgeFeePercent = (BigInt(redeemAmount) * BigInt(asset.feeRateNumeratorRedeem)) / 10000n
  const bridgeFee = bridgeFeeConst + bridgeFeePercent
  const minerFee = BigInt(
    Math.floor(
      (((transactionSize.RUNES_REDEEM / 10 ** 8) * feeBtc * btcPrice) / asset.price) *
        10 ** (asset.decimals - asset.trimDecimals)
    )
  )
  const totalFee = bridgeFee + minerFee
  const receiveAmount = BigInt(redeemAmount) - totalFee
  return {
    receiveAmount: formatSat(String(receiveAmount), asset.decimals - asset.trimDecimals),
    minerFee: formatSat(String(minerFee), asset.decimals - asset.trimDecimals),
    bridgeFee: formatSat(String(bridgeFee), asset.decimals - asset.trimDecimals),
    totalFee: formatSat(String(totalFee), asset.decimals - asset.trimDecimals),
    confirmNumber,
  }
}

export const calcRedeemMrc20Info = (
  redeemAmount: number,
  assetInfo: bridgeAssetPairReturnType,
  asset: assetReqReturnType
): FeeInfo => {
  const { btcPrice, feeBtc, amountLimitMaximum, amountLimitMinimum, confirmSequence, transactionSize } = assetInfo

  // 计算兑换的 BRC 金额
  const brcAmount = redeemAmount / 10 ** (asset.decimals - asset.trimDecimals)
  const redeemMrc20EqualBtcAmount = ((asset.price * brcAmount) / btcPrice) * 10 ** 8

  // 检查兑换金额是否在限制范围内
  if (redeemMrc20EqualBtcAmount < Number(amountLimitMinimum)) {
    throw new Error('amount less than minimum amount')
  }
  if (redeemMrc20EqualBtcAmount > Number(amountLimitMaximum)) {
    throw new Error('amount greater than maximum amount')
  }

  // 获取确认数
  const confirmNumber = confirmNumberBySeqAndAmount(redeemMrc20EqualBtcAmount, confirmSequence, 'MVC')

  // 计算桥接费用和矿工费用
  const bridgeFeeConst = BigInt(
    Math.floor(
      (((asset.feeRateConstRedeem / 10 ** 8) * btcPrice) / asset.price) * 10 ** (asset.decimals - asset.trimDecimals)
    )
  )
  const bridgeFeePercent = (BigInt(redeemAmount) * BigInt(asset.feeRateNumeratorRedeem)) / 10000n
  const bridgeFee = bridgeFeeConst + bridgeFeePercent

  const minerFee = BigInt(
    Math.floor(
      (((transactionSize.RUNES_REDEEM / 10 ** 8) * feeBtc * btcPrice) / asset.price) *
        10 ** (asset.decimals - asset.trimDecimals)
    )
  )

  const totalFee = bridgeFee + minerFee
  const receiveAmount = BigInt(redeemAmount) - totalFee

  // 格式化并返回结果
  return {
    receiveAmount: formatSat(receiveAmount.toString(), asset.decimals - asset.trimDecimals),
    minerFee: formatSat(minerFee.toString(), asset.decimals - asset.trimDecimals),
    bridgeFee: formatSat(bridgeFee.toString(), asset.decimals - asset.trimDecimals),
    totalFee: formatSat(totalFee.toString(), asset.decimals - asset.trimDecimals),
    confirmNumber,
  }
}

export const calcMintMRC20Info = (
  mintAmount: number,
  assetInfo: bridgeAssetPairReturnType,
  asset: assetReqReturnType
): FeeInfo => {
  const {
    btcPrice,
    mvcPrice,
    feeBtc,
    feeMvc,
    amountLimitMaximum,
    amountLimitMinimum,
    confirmSequence,
    transactionSize,
  } = assetInfo

  // 将 mintAmount 转换为资产小数位数后的实际金额
  const actualMintAmount = mintAmount / 10 ** asset.decimals

  // 计算 mintAmount 对应的 BTC 等值
  const mintMrc20EqualBtcAmount = ((asset.price * actualMintAmount) / btcPrice) * 10 ** 8

  // 检查是否在最小和最大限制范围内
  if (mintMrc20EqualBtcAmount < Number(amountLimitMinimum)) {
    throw new Error('amount less than minimum amount')
  }
  if (mintMrc20EqualBtcAmount > Number(amountLimitMaximum)) {
    throw new Error('amount greater than maximum amount')
  }

  // 获取确认数
  const confirmNumber = confirmNumberBySeqAndAmount(mintMrc20EqualBtcAmount, confirmSequence, 'MRC20')

  // 计算手续费
  const bridgeFee =
    (actualMintAmount * asset.feeRateNumeratorMint) / 10000 +
    ((asset.feeRateConstMint / 10 ** 8) * btcPrice) / asset.price
  const minerFee = (transactionSize.BTC_MINT * feeMvc * mvcPrice) / 10 ** 8 / asset.price
  const totalFee = bridgeFee + minerFee

  // 计算实际接收金额，并格式化为相应的小数位数
  const receiveAmount = actualMintAmount - totalFee
  const receiveAmountFixed = receiveAmount.toFixed(asset.decimals - asset.trimDecimals)

  return {
    receiveAmount: receiveAmountFixed,
    minerFee: minerFee.toFixed(asset.decimals),
    bridgeFee: bridgeFee.toFixed(asset.decimals),
    totalFee: totalFee.toFixed(asset.decimals),
    confirmNumber,
  }
}

export async function mintBtc(
  mintAmount: number,
  originTokenId: string,
  scriptType: ScriptType,
  btcWallet: BtcWallet,
  mvcWallet: MvcWallet,
  feeRate: number
) {
  const publicKey = btcWallet.getPublicKey().toString('hex')
  const publicKeySign = btcWallet.signMessage(publicKey, 'base64')
  const publicKeyReceive = mvcWallet.getPublicKey().toString('hex')
  const publicKeyReceiveSign = mvcWallet.signMessage(publicKeyReceive, 'base64')

  try {
    const { orderId, bridgeAddress, bridgeRuleServiceAddress, bridgeRuleServiceMintFee } =
      await createPrepayOrderMintBtc({
        publicKey,
        originTokenId,
        publicKeySign,
        publicKeyReceive,
        publicKeyReceiveSign,
        addressType: scriptType,
        amount: mintAmount.toString(),
      })

    const outputs = [
      {
        address: bridgeAddress,
        satoshis: Number(mintAmount),
      },
    ]

    console.log('bridgeRuleServiceAddress', bridgeRuleServiceAddress)
    console.log('bridgeRuleServiceMintFee', bridgeRuleServiceMintFee)

    if (bridgeRuleServiceAddress && bridgeRuleServiceMintFee) {
      outputs.push({
        address: bridgeRuleServiceAddress,
        satoshis: bridgeRuleServiceMintFee,
      })
    }

    console.log('outputs', outputs)

    const utxos = await getBtcUtxos(btcWallet.getAddress(), btcWallet.getScriptType() === ScriptType.P2PKH, false)

    console.log('utxos', utxos)
    console.log('feeRate', feeRate)
    console.log('outputs', outputs)

    const { rawTx, txId, txInputs, txOutputs } = btcWallet.signTx(SignType.SEND, {
      utxos,
      outputs,
      feeRate,
    })

    console.log('txId', txId)
    console.log('rawTx', rawTx)
    console.log('txInputs', txInputs)
    console.log('txOutputs', txOutputs)

    await submitPrepayOrderMintBtc({
      orderId,
      txHex: rawTx,
    })

    return { txId, recipient: bridgeAddress }
  } catch (error) {
    console.log('error', error)

    throw new Error((error as any).message || (error as any).msg)
  }
}

export async function mintMrc20(
  mintAmount: number,
  selectedPair: assetReqReturnType,
  scriptType: ScriptType,
  btcWallet: BtcWallet,
  mvcWallet: MvcWallet,
  feeRate: number
) {
  const publicKey = btcWallet.getPublicKey().toString('hex')
  const publicKeySign = btcWallet.signMessage(publicKey, 'base64')
  const publicKeyReceive = mvcWallet.getPublicKey().toString('hex')
  const publicKeyReceiveSign = mvcWallet.signMessage(publicKeyReceive, 'base64')

  const { orderId, bridgeAddress, bridgeRuleServiceAddress, bridgeRuleServiceMintFee } =
    await createPrepayOrderMintMrc20({
      amount: new Decimal(mintAmount).div(10 ** selectedPair.decimals).toFixed(),
      originTokenId: selectedPair.originTokenId,
      addressType: scriptType,
      publicKey: publicKey,
      publicKeySign: publicKeySign,
      publicKeyReceive,
      publicKeyReceiveSign: publicKeyReceiveSign,
    })

  const needRawTx = btcWallet.getScriptType() === ScriptType.P2PKH
  const utxos = await getBtcUtxos(btcWallet.getAddress(), needRawTx, false)
  const mrc20Utxos = await getMRC20Utxos(btcWallet.getAddress(), selectedPair.originTokenId, needRawTx)
  const { commitTx, revealTx } = btcWallet.signTx(SignType.MRC20_TRANSFER, {
    utxos,
    amount: new Decimal(mintAmount).div(10 ** selectedPair.decimals).toFixed(),
    flag: 'metaid',
    commitFeeRate: feeRate,
    revealFeeRate: feeRate,
    mrc20Utxos,
    body: JSON.stringify([
      {
        vout: 1,
        id: selectedPair.originTokenId,
        amount: new Decimal(mintAmount).div(10 ** selectedPair.decimals).toFixed(),
      },
    ]),
    revealAddr: bridgeAddress,
    service:
      bridgeRuleServiceAddress && bridgeRuleServiceMintFee
        ? {
            address: bridgeRuleServiceAddress,
            satoshis: bridgeRuleServiceMintFee,
          }
        : undefined,
  })

  const submitPrepayOrderMintDto = {
    orderId,
    txHexList: [commitTx.rawTx, revealTx.rawTx],
  }

  await submitPrepayOrderMintMrc20(submitPrepayOrderMintDto)

  return { txId: commitTx.txId, recipient: bridgeAddress }
}

export async function redeemBtc(
  redeemAmount: number,
  selectedPair: assetReqReturnType,
  scriptType: ScriptType,
  btcWallet: BtcWallet,
  mvcWallet: MvcWallet
) {
  try {
    const publicKey = mvcWallet.getPublicKey().toString('hex')
    const publicKeySign = mvcWallet.signMessage(publicKey, 'base64')
    const publicKeyReceive = btcWallet.getPublicKey().toString('hex')
    const publicKeyReceiveSign = btcWallet.signMessage(publicKeyReceive, 'base64')

    const createPrepayOrderDto = {
      amount: redeemAmount,
      originTokenId: selectedPair.originTokenId,
      addressType: scriptType,
      publicKey,
      publicKeySign,
      publicKeyReceive,
      publicKeyReceiveSign,
    }
    const createResp = await createPrepayOrderRedeemBtc(createPrepayOrderDto)
    const { orderId, bridgeAddress } = createResp
    const { targetTokenCodeHash, targetTokenGenesis, decimals } = selectedPair
    const res = await sendToken({
      broadcast: false,
      tasks: [
        {
          codehash: targetTokenCodeHash,
          genesis: targetTokenGenesis,
          receivers: [{ address: bridgeAddress, amount: redeemAmount.toString(), decimal: decimals.toString() }],
        },
      ],
    })

    const submitPrepayOrderRedeemDto = {
      orderId,
      txid: res.res[0].txid,
      txHexList: [res.res[0].routeCheckTxHex, res.res[0].txHex],
    }
    await sleep(3000)
    await submitPrepayOrderRedeemBtc(submitPrepayOrderRedeemDto)

    return { txId: res.res[0].txid, recipient: bridgeAddress }
  } catch (error) {
    throw new Error(error as any)
  }
}

export async function redeemMrc20(
  redeemAmount: number,
  selectedPair: assetReqReturnType,
  scriptType: ScriptType,
  btcWallet: BtcWallet,
  mvcWallet: MvcWallet
) {
  try {
    const publicKey = mvcWallet.getPublicKey().toString('hex')
    const publicKeySign = mvcWallet.signMessage(publicKey, 'base64')
    const publicKeyReceive = btcWallet.getPublicKey().toString('hex')
    const publicKeyReceiveSign = btcWallet.signMessage(publicKeyReceive, 'base64')
    const createPrepayOrderDto = {
      amount: redeemAmount,
      originTokenId: selectedPair.originTokenId,
      addressType: scriptType,
      publicKey,
      publicKeySign,
      publicKeyReceive,
      publicKeyReceiveSign,
    }
    const createResp = await createPrepayOrderRedeemMrc20(createPrepayOrderDto)
    const { orderId, bridgeAddress } = createResp
    const { targetTokenCodeHash, targetTokenGenesis, decimals } = selectedPair
    const res = await sendToken({
      broadcast: false,
      tasks: [
        {
          codehash: targetTokenCodeHash,
          genesis: targetTokenGenesis,
          receivers: [{ address: bridgeAddress, amount: redeemAmount.toString(), decimal: decimals.toString() }],
        },
      ],
    })
    const submitPrepayOrderRedeemDto = {
      orderId,
      txid: res.res[0].txid,
      txHexList: [res.res[0].routeCheckTxHex, res.res[0].txHex],
    }
    await sleep(3000)
    await submitPrepayOrderRedeemMrc20(submitPrepayOrderRedeemDto)
    return { txId: res.res[0].txid, recipient: bridgeAddress }
  } catch (error) {
    throw new Error(error as any)
  }
}
