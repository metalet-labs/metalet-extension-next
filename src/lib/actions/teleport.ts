/**
 * Teleport 跨链转移 MRC-20 工具函数
 * 
 * Teleport 实现了 MRC-20 的跨链功能，可以视为 transfer 的扩维版本。
 * - transfer 将 MRC-20 分配到本交易的 output 中
 * - teleport 将 MRC-20 分配到其他链的 output 中
 * 
 * Transfer 操作直接复用现有的 MRC20TransferTool，只是 body 格式不同：
 * - 普通 transfer body: [{ vout, id, amount }]
 * - teleport transfer body: [{ vout, id, amount, coord, chain, type }]
 */

import Decimal from 'decimal.js'
import { Chain, SignType, ScriptType } from '@metalet/utxo-wallet-service'
import { process as createPin, CreatePinParams, CreatePinResult, PinDetail } from './create-pin'
import { getMRC20Utxos, MRC20UTXO } from '@/queries/mrc20'
import { getBtcUtxos } from '@/queries/utxos'
import { getCurrentWallet } from '@/lib/wallet'
import { broadcastBTCTx } from '@/queries/transaction'

export type SupportedChain = 'btc' | 'doge' | 'mvc'

export interface TeleportMRC20Params {
  // 源链
  fromChain: SupportedChain
  // 目标链
  toChain: SupportedChain
  // MRC20 Token ID
  mrc20Id: string
  // 跨链数量
  amount: string
  // 源链地址（用于获取 MRC-20 UTXO）
  fromAddress: string
  // 源链费率
  fromFeeRate: number
  // 目标链费率
  toFeeRate: number
  // 是否广播
  noBroadcast?: boolean
}

export interface TeleportResult {
  // 源链 transfer 交易
  transferResult: {
    commitTx: { txId: string; rawTx: string }
    revealTx: { txId: string; rawTx: string }
  }
  // 目标链 arrival 交易
  arrivalResult: CreatePinResult
}

/**
 * 获取链名称标识（用于协议 chain 字段）
 */
function getChainName(chain: SupportedChain): string {
  // chain 字段的枚举值：btc, doge, mvc
  return chain
}

/**
 * 构建 MRC20 Arrival Pin 数据
 * 
 * path: /ft/mrc20/arrival
 * {
 *   "assetOutpoint": "{Outpoint}", // 资产的 Outpoint
 *   "amount": "",
 *   "tickId": "",
 *   "locationIndex": 0, // 落脚索引
 *   "metadata": ""
 * }
 */
function buildArrivalPinData(params: {
  assetOutpoint: string
  amount: string
  tickId: string
  locationIndex?: number
  metadata?: string
}): PinDetail {
  const body = JSON.stringify({
    assetOutpoint: params.assetOutpoint,
    amount: params.amount,
    tickId: params.tickId,
    locationIndex: params.locationIndex ?? 0,
    metadata: params.metadata ?? '',
  })

  return {
    metaidData: {
      operation: 'create',
      path: '/ft/mrc20/arrival',
      body,
      contentType: 'application/json',
      flag: 'metaid',
    },
  }
}

/**
 * 从 MRC-20 UTXO 列表中查找合适的 UTXO
 * 找到 amount 足够的单个 UTXO
 * 
 * @throws 如果没有足够余额的单个 UTXO，抛出错误（TODO: 后续需要支持归集）
 */
async function findMRC20AssetOutpoint(
  address: string,
  mrc20Id: string,
  requiredAmount: string
): Promise<{ assetOutpoint: string; utxo: MRC20UTXO }> {
  const utxos = await getMRC20Utxos(address, mrc20Id)
  
  if (!utxos || utxos.length === 0) {
    throw new Error('No MRC-20 UTXO found for this address and token')
  }
  
  const requiredAmountNum = BigInt(requiredAmount)
  
  // 遍历所有 UTXO，找到合适的
  for (const utxo of utxos) {
    for (const mrc20 of utxo.mrc20s) {
      if (mrc20.mrc20Id === mrc20Id) {
        const utxoAmount = BigInt(mrc20.amount)
        if (utxoAmount >= requiredAmountNum) {
          // txPoint 格式为 "txid:vout"，直接使用
          const assetOutpoint = mrc20.txPoint
          return { assetOutpoint, utxo }
        }
      }
    }
  }
  
  // TODO: 如果没有单个 UTXO 足够，需要先归集再转移
  throw new Error(`No single MRC-20 UTXO has enough balance (required: ${requiredAmount}). Please merge UTXOs first.`)
}

/**
 * 执行 MRC20 Teleport 跨链转移
 * 
 * 正确的 Teleport 流程：
 * 1. 获取 MRC-20 资产的 UTXO 信息（assetOutpoint）
 * 2. 在目标链创建 Arrival 交易（包含 assetOutpoint）
 * 3. 在源链创建 Transfer 交易（使用 MRC20TransferTool，coord 指向 Arrival）
 */
export async function teleportMRC20(params: TeleportMRC20Params): Promise<TeleportResult> {
  const {
    fromChain,
    toChain,
    mrc20Id,
    amount,
    fromAddress,
    fromFeeRate,
    toFeeRate,
    noBroadcast = false,
  } = params

  // 1. 获取 MRC-20 资产的 UTXO 信息
  const { assetOutpoint } = await findMRC20AssetOutpoint(fromAddress, mrc20Id, amount)
  
  console.log('[Teleport] Found MRC-20 asset:', { assetOutpoint, amount })

  // 2. 在目标链创建 Arrival Pin
  const arrivalPinData = buildArrivalPinData({
    assetOutpoint,
    amount,
    tickId: mrc20Id,
    locationIndex: 0,
  })

  const arrivalParams: CreatePinParams = {
    chain: toChain,
    dataList: [arrivalPinData],
    feeRate: toFeeRate,
    noBroadcast,
  }

  const arrivalResult = await createPin(arrivalParams)

  // 获取 Arrival 交易的 outpoint 作为 coord
  let coord = ''
  if (arrivalResult.revealTxIds && arrivalResult.revealTxIds.length > 0) {
    // BTC/DOGE: 使用 reveal 交易的 txid
    coord = `${arrivalResult.revealTxIds[0]}i0`
  } else if (arrivalResult.txids && arrivalResult.txids.length > 0) {
    // MVC: 使用交易的 txid
    coord = `${arrivalResult.txids[0]}i0`
  }
  
  console.log('[Teleport] Arrival created, coord:', coord)

  // 3. 在源链创建 Transfer 交易（使用 MRC20TransferTool）
  // TODO: 目前只支持 BTC 链作为源链，DOGE 和 MVC 需要后续实现
  if (fromChain !== 'btc') {
    throw new Error(`Teleport from ${fromChain} chain is not supported yet. Only BTC is supported as source chain.`)
  }

  // Transfer body 是一个数组，包含 teleport 特有字段
  const transferBody = JSON.stringify([
    {
      vout: 1, // 输出到 reveal 的第 1 个 vout
      id: mrc20Id,
      amount: new Decimal(amount).toFixed(),
      coord: coord,
      chain: getChainName(toChain),
      type: 'teleport',
    },
  ])

  // 获取 BTC 钱包和 UTXO
  const wallet = await getCurrentWallet(Chain.BTC)
  const needRawTx = wallet.getScriptType() === ScriptType.P2PKH
  const utxos = await getBtcUtxos(fromAddress, needRawTx, true)
  const mrc20Utxos = await getMRC20Utxos(fromAddress, mrc20Id, needRawTx)

  // 使用现有的 MRC20_TRANSFER 签名类型
  const { commitTx, revealTx } = wallet.signTx(SignType.MRC20_TRANSFER, {
    utxos,
    amount: new Decimal(amount).toFixed(),
    flag: 'metaid',
    commitFeeRate: fromFeeRate,
    revealFeeRate: fromFeeRate,
    mrc20Utxos,
    body: transferBody,
  })
  
  console.log('[Teleport] Transfer created:', { commitTxId: commitTx.txId, revealTxId: revealTx.txId })

  // 广播 BTC Transfer 交易（先广播 commit，再广播 reveal）
  if (!noBroadcast) {
    console.log('[Teleport] Broadcasting BTC Transfer transactions...')
    
    // 广播 commit 交易
    const broadcastedCommitTxId = await broadcastBTCTx(commitTx.rawTx)
    console.log('[Teleport] Commit tx broadcasted:', broadcastedCommitTxId)
    
    // 广播 reveal 交易
    const broadcastedRevealTxId = await broadcastBTCTx(revealTx.rawTx)
    console.log('[Teleport] Reveal tx broadcasted:', broadcastedRevealTxId)
  }

  return {
    transferResult: { commitTx, revealTx },
    arrivalResult,
  }
}

/**
 * 预估 Teleport 费用
 * 
 * 注意：不同链的费率单位不同
 * - BTC: sat/vB
 * - DOGE: sat/KB (需要除以 1000 得到每字节费率)
 * - MVC: sat/byte
 */
export async function estimateTeleportFee(params: TeleportMRC20Params): Promise<{
  fromChainFee: number
  toChainFee: number
  totalFee: number
}> {
  // 简单估算费用（基于费率和预估交易大小）
  // MRC20 Transfer 交易大约 500 vbytes (commit + reveal)
  // Arrival Pin 交易大约 300 vbytes
  const transferTxSize = 500
  const arrivalTxSize = 300
  
  // 计算源链费用
  let fromChainFee: number
  if (params.fromChain === 'doge') {
    // DOGE 费率是 sat/KB，需要转换
    fromChainFee = Math.ceil((params.fromFeeRate / 1000) * transferTxSize)
  } else {
    fromChainFee = params.fromFeeRate * transferTxSize
  }
  
  // 计算目标链费用
  let toChainFee: number
  if (params.toChain === 'doge') {
    // DOGE 费率是 sat/KB，需要转换
    toChainFee = Math.ceil((params.toFeeRate / 1000) * arrivalTxSize)
  } else {
    toChainFee = params.toFeeRate * arrivalTxSize
  }

  return {
    fromChainFee,
    toChainFee,
    totalFee: fromChainFee + toChainFee,
  }
}

/**
 * 获取其他可选目标链
 */
export function getAvailableTargetChains(fromChain: SupportedChain): SupportedChain[] {
  const allChains: SupportedChain[] = ['btc', 'doge', 'mvc']
  return allChains.filter(chain => chain !== fromChain)
}

/**
 * 获取链的显示名称
 */
export function getChainDisplayName(chain: SupportedChain): string {
  const names: Record<SupportedChain, string> = {
    btc: 'Bitcoin',
    doge: 'Dogecoin',
    mvc: 'MicrovisionChain',
  }
  return names[chain] || chain.toUpperCase()
}

/**
 * 获取链的颜色样式
 */
export function getChainColor(chain: SupportedChain): string {
  const colors: Record<SupportedChain, string> = {
    btc: '#F7931A',
    doge: '#C2A633',
    mvc: '#767EFF',
  }
  return colors[chain] || '#666666'
}
