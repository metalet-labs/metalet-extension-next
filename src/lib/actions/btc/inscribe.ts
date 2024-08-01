import { getBtcUtxos } from '@/queries/utxos'
import { getCurrentWallet } from '../../wallet'
import { Chain, ScriptType, SignType } from '@metalet/utxo-wallet-service'

export type PrevOutput = {
  txId: string
  vOut: number
  amount: number
  address: string
}

export type Operation = 'init' | 'create' | 'modify' | 'revoke'

export type MetaidData = {
  body?: string
  operation: Operation
  path?: string
  contentType?: string
  encryption?: '0' | '1' | '2'
  version?: string
  encoding?: BufferEncoding
  revealAddr: string
  flag?: 'metaid' | 'testid'
}

export type InscriptionRequest = {
  commitTxPrevOutputList: PrevOutput[]
  feeRate: number
  metaidDataList: MetaidData[]
  revealOutValue: number
  changeAddress: string
  minChangeValue?: number
  shareData?: string
  masterPublicKey?: string
  chainCode?: string
  commitTx?: string
  signatureList?: string[]
  service?: {
    address: string
    satoshis: string
  }
}

export async function process({
  data: { metaidDataList, service, feeRate },
}: {
  data: Omit<InscriptionRequest, 'commitTxPrevOutputList'>
}) {
  const wallet = await getCurrentWallet(Chain.BTC)
  const address = wallet.getAddress()
  const utxos = await getBtcUtxos(address, wallet.getScriptType() === ScriptType.P2PKH, true)
  return wallet.signTx(SignType.INSCRIBE_METAIDPIN, {
    utxos,
    feeRate,
    metaidDataList,
    service,
  })
}
