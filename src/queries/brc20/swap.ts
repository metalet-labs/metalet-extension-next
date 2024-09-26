import { swapBRC20Api } from '../request'
import { ComputedRef, Ref } from 'vue'
import { Network } from '@/lib/network'
import { getBtcUtxos, UTXO } from '../utxos'
import { ORDER_QUERY_INTERVAL } from '../constants'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { BtcWallet, ScriptType, SignType } from '@metalet/utxo-wallet-service'
import { Psbt } from 'bitcoinjs-lib'

export type SwapType = '1x' | 'x2' | '2x' | 'x1'

type SwapPreviewResult = {
  gas: string
  ratio: string
  poolRatio: string
  serviceFee: string
  sourceAmount: string
  targetAmount: string
  priceImpact: string
}

export type RuneUtxoRefined = {
  amount: string
  satoshis: number
  runePosition: string
}

export const previewSwap = async ({
  token1,
  token2,
  address,
  swapType,
  sourceAmount,
}: {
  address: string
  token1: string
  token2: string
  swapType: SwapType
  sourceAmount: string
}): Promise<SwapPreviewResult> => {
  return await swapBRC20Api<SwapPreviewResult>('/preview/swap').post({
    token1,
    token2,
    address,
    swapType,
    sourceAmount,
  })
}

// 定义参数类型
type SwapBuildParams = {
  address: string
  pubkey: string
  token1: string
  token2: string
  sourceAmount: string
  feeRate: number
  runeUtxos?: RuneUtxoRefined[]
}

type SwapBuildResult = {
  rawPsbt: string
  buildId: string
  type: string
  feeRate: number
}

const build1xSwap = async (params: SwapBuildParams): Promise<SwapBuildResult> => {
  const res = await swapBRC20Api<Omit<SwapBuildResult, 'feeRate'>>('/build/1x').post(params)
  console.log('res', res)

  return {
    ...res,
    feeRate: params.feeRate,
  }
}

const buildX2Swap = async (params: SwapBuildParams): Promise<SwapBuildResult> => {
  const res = await swapBRC20Api<Omit<SwapBuildResult, 'feeRate'>>('/build/x2').post(params)
  return {
    ...res,
    feeRate: params.feeRate,
  }
}

const build2xSwap = async (params: SwapBuildParams): Promise<SwapBuildResult> => {
  const res = await swapBRC20Api<Omit<SwapBuildResult, 'feeRate'>>('/build/2x').post(params)
  return {
    ...res,
    feeRate: params.feeRate,
  }
}

const buildX1Swap = async (params: SwapBuildParams): Promise<SwapBuildResult> => {
  const res = await swapBRC20Api<Omit<SwapBuildResult, 'feeRate'>>('/build/x1').post(params)
  return {
    ...res,
    feeRate: params.feeRate,
  }
}

export const useBuildSwapMutation = (swapType: Ref<string>) => {
  const buildSwapFn = () => {
    switch (swapType.value) {
      case '1x':
        return build1xSwap
      case '2x':
        return build2xSwap
      case 'x2':
        return buildX2Swap
      case 'x1':
        return buildX1Swap
      default:
        throw new Error(`Unknown swap type: ${swapType}`)
    }
  }

  return useMutation({
    mutationFn: (params: SwapBuildParams) => buildSwapFn()(params),
  })
}

export const signSwapPsbt = async ({
  type,
  rawPsbt,
  feeRate,
  btcWallet,
}: {
  type: SwapType
  rawPsbt: string
  feeRate: number
  btcWallet: BtcWallet
}) => {
  switch (type) {
    case '1x':
      const utxos = await getBtcUtxos(btcWallet.getAddress(), btcWallet.getScriptType() === ScriptType.P2PKH)
      const { psbtHex } = btcWallet.signTx(SignType.PAY, {
        utxos,
        psbtHex: rawPsbt,
        feeRate: feeRate,
        autoFinalized: false,
      })

      return psbtHex

    case 'x2': {
      return ''
    }

    case '2x': {
      const psbt = Psbt.fromHex(rawPsbt)
      const { psbtHex } = btcWallet.signTx(SignType.SIGN_PSBT, {
        psbtHex: rawPsbt,
        autoFinalized: false,
        toSignInputs: psbt.data.inputs.map((_, index) => {
          return {
            index,
            sighashTypes: [0x81],
          }
        }),
      })

      return psbtHex
    }

    case 'x1': {
      return ''
    }
  }
}

export const postTask = async ({
  address,
  buildId,
  rawPsbt,
}: {
  address: string
  buildId: string
  rawPsbt: string
}): Promise<{
  buildId: string
}> => {
  return await swapBRC20Api<{
    rawPsbt: string
    buildId: string
    type: string
  }>('/tasks').post({
    address,
    buildId,
    rawPsbt,
  })
}

interface PostTaskParams {
  address: string
  buildId: string
  rawPsbt: string
}

export const usePostSwapMutation = () => {
  return useMutation((params: PostTaskParams) => postTask(params))
}

type TaskType = '1x' | 'x2' | '2x' | 'x1' | 'add' | 'remove'

interface Task {
  buildId: string
  type: TaskType
  status: 'failed' | 'completed' | 'built'
  address: string
  txid?: string
  failedReason?: string
  token1: string
  token2: string
  amount1: string
  amount2: string
  feeRate: number
  inflatedFeeRate: number
  minerFee: number
  inscriptionFee: number
  equity: string
  createdAt: number
  updatedAt: number
}

const getOngoingTask = async ({
  address,
  network,
  buildId,
}: {
  address: string
  network: Network
  buildId: string
}): Promise<Task> => {
  return await swapBRC20Api<Task>('/ongoing-task').get({
    address,
    net: network,
    build_id: buildId,
  })
}

export const useOngoingTaskQuery = (
  address: ComputedRef<string>,
  network: Ref<Network>,
  buildId: Ref<string>,
  enabled: ComputedRef<boolean>
) =>
  useQuery({
    queryKey: ['runesSwapOngoingTask', address, network, buildId],
    queryFn: () =>
      getOngoingTask({
        address: address.value,
        network: network.value,
        buildId: buildId.value,
      }),
    enabled,
    refetchInterval: ORDER_QUERY_INTERVAL,
  })
