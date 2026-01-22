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
import { fetchDogeUtxos } from '@/queries/doge/utxos'
import { getCurrentWallet } from '@/lib/wallet'
import { getDogeWallet } from './doge/wallet'
import { broadcastBTCTx } from '@/queries/transaction'
import { broadcastDogeTx } from '@/queries/doge/transaction'

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
  // 预处理交易（拆分或合并），如果不需要则为 null
  prepareResult: {
    commitTx: { txId: string; rawTx: string }
    revealTx: { txId: string; rawTx: string }
  } | null
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
 * UTXO 检查结果类型
 */
type UTXOCheckResult = 
  | { type: 'exact'; utxo: MRC20UTXO; assetOutpoint: string }  // 精确匹配
  | { type: 'split'; utxo: MRC20UTXO; assetOutpoint: string }  // 需要拆分（UTXO 金额 > 所需金额）
  | { type: 'merge'; utxos: MRC20UTXO[]; totalAmount: bigint } // 需要合并（多个小 UTXO）
  | { type: 'insufficient'; totalAmount: bigint }              // 余额不足

/**
 * 检查 MRC-20 UTXO 情况，决定是否需要预处理
 */
async function checkMRC20UTXOs(
  address: string,
  mrc20Id: string,
  requiredAmount: string
): Promise<UTXOCheckResult> {
  const utxos = await getMRC20Utxos(address, mrc20Id)
  
  if (!utxos || utxos.length === 0) {
    return { type: 'insufficient', totalAmount: BigInt(0) }
  }
  
  const requiredAmountNum = BigInt(requiredAmount)
  let totalAmount = BigInt(0)
  const eligibleUtxos: { utxo: MRC20UTXO; mrc20Amount: bigint; txPoint: string }[] = []
  
  // 遍历所有 UTXO，收集信息
  for (const utxo of utxos) {
    for (const mrc20 of utxo.mrc20s) {
      if (mrc20.mrc20Id === mrc20Id) {
        const utxoAmount = BigInt(mrc20.amount)
        totalAmount += utxoAmount
        eligibleUtxos.push({ utxo, mrc20Amount: utxoAmount, txPoint: mrc20.txPoint })
      }
    }
  }
  
  // 检查总余额是否足够
  if (totalAmount < requiredAmountNum) {
    return { type: 'insufficient', totalAmount }
  }
  
  // 按金额从小到大排序
  eligibleUtxos.sort((a, b) => Number(a.mrc20Amount - b.mrc20Amount))
  
  // 1. 先找精确匹配的
  for (const item of eligibleUtxos) {
    if (item.mrc20Amount === requiredAmountNum) {
      return { type: 'exact', utxo: item.utxo, assetOutpoint: item.txPoint }
    }
  }
  
  // 2. 再找可以拆分的（金额 > 所需）
  for (const item of eligibleUtxos) {
    if (item.mrc20Amount > requiredAmountNum) {
      return { type: 'split', utxo: item.utxo, assetOutpoint: item.txPoint }
    }
  }
  
  // 3. 需要合并多个 UTXO
  // 贪心算法：选择最少数量的 UTXO 来满足金额
  const selectedUtxos: MRC20UTXO[] = []
  let selectedAmount = BigInt(0)
  
  // 从大到小选择
  for (let i = eligibleUtxos.length - 1; i >= 0 && selectedAmount < requiredAmountNum; i--) {
    selectedUtxos.push(eligibleUtxos[i].utxo)
    selectedAmount += eligibleUtxos[i].mrc20Amount
  }
  
  return { type: 'merge', utxos: selectedUtxos, totalAmount: selectedAmount }
}

/**
 * 从 MRC-20 UTXO 列表中查找合适的 UTXO
 * 找到 amount 精确匹配的单个 UTXO（已经过预处理）
 */
async function findExactMRC20AssetOutpoint(
  address: string,
  mrc20Id: string,
  requiredAmount: string
): Promise<{ assetOutpoint: string; utxo: MRC20UTXO }> {
  const utxos = await getMRC20Utxos(address, mrc20Id)
  
  if (!utxos || utxos.length === 0) {
    throw new Error('No MRC-20 UTXO found for this address and token')
  }
  
  const requiredAmountNum = BigInt(requiredAmount)
  
  // 遍历所有 UTXO，找精确匹配的
  for (const utxo of utxos) {
    for (const mrc20 of utxo.mrc20s) {
      if (mrc20.mrc20Id === mrc20Id) {
        const utxoAmount = BigInt(mrc20.amount)
        if (utxoAmount === requiredAmountNum) {
          const assetOutpoint = mrc20.txPoint
          return { assetOutpoint, utxo }
        }
      }
    }
  }
  
  throw new Error(`No exact MRC-20 UTXO found (required: ${requiredAmount}). Prepare transaction may have failed.`)
}

/**
 * 执行预处理交易（拆分或合并 UTXO）- BTC 链
 */
async function executeBtcPrepareTransaction(
  fromAddress: string,
  mrc20Id: string,
  amount: string,
  feeRate: number,
  noBroadcast: boolean
): Promise<{ commitTx: { txId: string; rawTx: string }; revealTx: { txId: string; rawTx: string } }> {
  console.log('[Teleport] Executing BTC prepare transaction (split/merge)...')
  
  const wallet = await getCurrentWallet(Chain.BTC)
  const needRawTx = wallet.getScriptType() === ScriptType.P2PKH
  const utxos = await getBtcUtxos(fromAddress, needRawTx, true)
  const mrc20Utxos = await getMRC20Utxos(fromAddress, mrc20Id, needRawTx, 'btc')

  const transferBody = JSON.stringify([
    {
      vout: 1,
      id: mrc20Id,
      amount: new Decimal(amount).toFixed(),
    },
  ])

  const { commitTx, revealTx } = wallet.signTx(SignType.MRC20_TRANSFER, {
    utxos,
    amount: new Decimal(amount).toFixed(),
    flag: 'metaid',
    commitFeeRate: feeRate,
    revealFeeRate: feeRate,
    mrc20Utxos,
    body: transferBody,
  })
  
  console.log('[Teleport] BTC Prepare transaction created:', { commitTxId: commitTx.txId, revealTxId: revealTx.txId })

  if (!noBroadcast) {
    console.log('[Teleport] Broadcasting BTC prepare transactions...')
    await broadcastBTCTx(commitTx.rawTx)
    await broadcastBTCTx(revealTx.rawTx)
  }

  return { commitTx, revealTx }
}

/**
 * 执行预处理交易（拆分或合并 UTXO）- DOGE 链
 */
async function executeDogePrepareTransaction(
  fromAddress: string,
  mrc20Id: string,
  amount: string,
  feeRate: number,
  noBroadcast: boolean
): Promise<{ commitTx: { txId: string; rawTx: string }; revealTx: { txId: string; rawTx: string } }> {
  console.log('[Teleport] Executing DOGE prepare transaction (split/merge)...')
  
  const wallet = await getDogeWallet()
  const rawUtxos = await fetchDogeUtxos(fromAddress, true)
  // 转换 DOGE UTXO 格式
  const utxos = rawUtxos.map(u => ({ ...u, confirmed: u.confirmed ?? false }))
  const mrc20Utxos = await getMRC20Utxos(fromAddress, mrc20Id, true, 'doge')

  const transferBody = JSON.stringify([
    {
      vout: 1,
      id: mrc20Id,
      amount: new Decimal(amount).toFixed(),
    },
  ])

  const { commitTx, revealTx } = wallet.signTx(SignType.MRC20_TRANSFER, {
    utxos,
    amount: new Decimal(amount).toFixed(),
    flag: 'metaid',
    commitFeeRate: feeRate,
    revealFeeRate: feeRate,
    mrc20Utxos,
    body: transferBody,
  })
  
  console.log('[Teleport] DOGE Prepare transaction created:', { commitTxId: commitTx.txId, revealTxId: revealTx.txId })

  if (!noBroadcast) {
    console.log('[Teleport] Broadcasting DOGE prepare transactions...')
    await broadcastDogeTx(commitTx.rawTx)
    await broadcastDogeTx(revealTx.rawTx)
  }

  return { commitTx, revealTx }
}

/**
 * 执行预处理交易（拆分或合并 UTXO）
 * 转账精确金额给自己，生成一个精确匹配的 UTXO
 */
async function executePrepareTransaction(
  fromChain: SupportedChain,
  fromAddress: string,
  mrc20Id: string,
  amount: string,
  feeRate: number,
  noBroadcast: boolean
): Promise<{ commitTx: { txId: string; rawTx: string }; revealTx: { txId: string; rawTx: string } }> {
  if (fromChain === 'btc') {
    return executeBtcPrepareTransaction(fromAddress, mrc20Id, amount, feeRate, noBroadcast)
  } else if (fromChain === 'doge') {
    return executeDogePrepareTransaction(fromAddress, mrc20Id, amount, feeRate, noBroadcast)
  } else {
    throw new Error(`Prepare transaction from ${fromChain} is not supported`)
  }
}

/**
 * 执行 MRC20 Teleport 跨链转移
 * 
 * Teleport 约束：Transfer 交易必须使用精确匹配的单个 UTXO
 * 
 * 完整流程（最多 3 笔交易）：
 * 1. [可选] 预处理交易：如果没有精确匹配的 UTXO，先转给自己进行拆分或合并
 * 2. Arrival 交易：在目标链创建接收位置
 * 3. Transfer 交易：在源链执行 teleport（使用精确匹配的 UTXO）
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

  // 支持 BTC 和 DOGE 作为源链
  if (fromChain !== 'btc' && fromChain !== 'doge') {
    throw new Error(`Teleport from ${fromChain} chain is not supported yet. Only BTC and DOGE are supported as source chain.`)
  }

  // 1. 检查 UTXO 情况
  const checkResult = await checkMRC20UTXOs(fromAddress, mrc20Id, amount)
  console.log('[Teleport] UTXO check result:', checkResult.type)

  let prepareResult: { commitTx: { txId: string; rawTx: string }; revealTx: { txId: string; rawTx: string } } | null = null
  let assetOutpoint: string

  switch (checkResult.type) {
    case 'insufficient':
      throw new Error(`Insufficient MRC-20 balance. Total: ${checkResult.totalAmount.toString()}, Required: ${amount}`)
    
    case 'exact':
      console.log('[Teleport] Found exact matching UTXO, no prepare needed')
      assetOutpoint = checkResult.assetOutpoint
      break
    
    case 'split':
      console.log('[Teleport] Need to split UTXO, executing prepare transaction...')
      prepareResult = await executePrepareTransaction(fromChain, fromAddress, mrc20Id, amount, fromFeeRate, noBroadcast)
      assetOutpoint = `${prepareResult.revealTx.txId}:1`
      break
    
    case 'merge':
      console.log('[Teleport] Need to merge UTXOs, executing prepare transaction...')
      prepareResult = await executePrepareTransaction(fromChain, fromAddress, mrc20Id, amount, fromFeeRate, noBroadcast)
      assetOutpoint = `${prepareResult.revealTx.txId}:1`
      break
  }

  console.log('[Teleport] Using asset outpoint:', assetOutpoint)

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
    coord = `${arrivalResult.revealTxIds[0]}i0`
  } else if (arrivalResult.txids && arrivalResult.txids.length > 0) {
    coord = `${arrivalResult.txids[0]}i0`
  }
  
  console.log('[Teleport] Arrival created, coord:', coord)

  // 3. 在源链创建 Teleport Transfer 交易
  const transferBody = JSON.stringify([
    {
      vout: 1,
      id: mrc20Id,
      amount: new Decimal(amount).toFixed(),
      coord: coord,
      chain: getChainName(toChain),
      type: 'teleport',
    },
  ])

  // 根据源链获取钱包和 UTXO
  const wallet = fromChain === 'btc' 
    ? await getCurrentWallet(Chain.BTC)
    : await getDogeWallet()
  
  const needRawTx = fromChain === 'doge' || (fromChain === 'btc' && wallet.getScriptType() === ScriptType.P2PKH)
  
  // 获取普通 UTXO
  let utxos: any[]
  if (fromChain === 'btc') {
    utxos = await getBtcUtxos(fromAddress, needRawTx, true)
  } else {
    const rawUtxos = await fetchDogeUtxos(fromAddress, needRawTx)
    utxos = rawUtxos.map(u => ({ ...u, confirmed: u.confirmed ?? false }))
  }
  
  // 获取 MRC-20 UTXO
  let mrc20Utxos: MRC20UTXO[]
  const chainEnum = fromChain === 'btc' ? Chain.BTC : Chain.DOGE
  
  if (prepareResult) {
    console.log('[Teleport] Using prepared MRC20 UTXO from prepare transaction')
    
    const preparedMrc20Utxo: MRC20UTXO = {
      txId: prepareResult.revealTx.txId,
      outputIndex: 1,
      satoshis: fromChain === 'doge' ? 600 : 546,
      confirmed: false,
      rawTx: needRawTx ? prepareResult.revealTx.rawTx : undefined,
      chain: chainEnum,
      address: fromAddress,
      scriptPk: '',
      timestamp: Date.now(),
      blockHeight: 0,
      mrc20s: [{
        tick: '',
        mrc20Id: mrc20Id,
        txPoint: assetOutpoint,
        amount: amount,
        balance: amount,
        decimals: '0',
        metaData: '',
        tokenName: '',
        unsafeAmount: '0',
        unsafeBalance: '0',
        pendingInBalance: '0',
        pendingOutBalance: '0',
        deployAddress: '',
        deployUserInfo: { name: '', avatar: '' },
        tag: '',
      }],
    }
    
    mrc20Utxos = [preparedMrc20Utxo]
  } else {
    const allMrc20Utxos = await getMRC20Utxos(fromAddress, mrc20Id, needRawTx, fromChain)
    const matchingUtxo = allMrc20Utxos.find(utxo => 
      utxo.mrc20s.some(mrc20 => mrc20.txPoint === assetOutpoint)
    )
    if (!matchingUtxo) {
      throw new Error(`Cannot find MRC-20 UTXO with txPoint: ${assetOutpoint}`)
    }
    mrc20Utxos = [matchingUtxo]
  }

  // 使用 MRC20_TELEPORT 签名类型
  const { commitTx, revealTx } = wallet.signTx(SignType.MRC20_TELEPORT, {
    utxos,
    amount: new Decimal(amount).toFixed(),
    flag: 'metaid',
    commitFeeRate: fromFeeRate,
    revealFeeRate: fromFeeRate,
    mrc20Utxo: mrc20Utxos[0],
    body: transferBody,
  })
  
  console.log('[Teleport] Transfer created:', { commitTxId: commitTx.txId, revealTxId: revealTx.txId })

  // 广播 Transfer 交易
  if (!noBroadcast) {
    console.log(`[Teleport] Broadcasting ${fromChain.toUpperCase()} Transfer transactions...`)
    
    const broadcastFn = fromChain === 'btc' ? broadcastBTCTx : broadcastDogeTx
    
    const broadcastedCommitTxId = await broadcastFn(commitTx.rawTx)
    console.log('[Teleport] Commit tx broadcasted:', broadcastedCommitTxId)
    
    const broadcastedRevealTxId = await broadcastFn(revealTx.rawTx)
    console.log('[Teleport] Reveal tx broadcasted:', broadcastedRevealTxId)
  }

  return {
    prepareResult,
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
 * 注意：MVC 暂不支持 mrc20-v2，暂时禁用
 */
export function getAvailableTargetChains(fromChain: SupportedChain): SupportedChain[] {
  // MVC 暂不支持 mrc20-v2，只支持 BTC 和 DOGE
  const supportedChains: SupportedChain[] = ['btc', 'doge']
  return supportedChains.filter(chain => chain !== fromChain)
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
