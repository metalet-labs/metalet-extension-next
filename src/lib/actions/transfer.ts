import { FEEB } from '@/data/config'
import { getNetwork } from '../network'
import { getCurrentWallet } from '../wallet'
import { Chain } from '@metalet/utxo-wallet-service'
import { API_NET, API_TARGET, FtManager, Wallet, mvc } from 'meta-contract'
import { getDefaultMVCTRate } from '@/queries/transaction'

export type Receiver = {
  address: string
  amount: string
  decimal?: string
}
export type TransferTask = {
  genesis?: string
  codehash?: string
  receivers: Receiver[]
  metaidData?: any
}

function buildOpReturnV2(metaidData: any): any {
  const res1 = ['metaid', metaidData.operation]
  const res2 = []
  if (metaidData.operation !== 'init') {
    res2.push(metaidData.path!)
    res2.push(metaidData?.encryption ?? '0')
    res2.push(metaidData?.version ?? '1.0.0')
    res2.push(metaidData?.contentType ?? 'text/plain;utf-8')

    const body = !metaidData.body
      ? undefined
      : Buffer.isBuffer(metaidData.body)
        ? metaidData.body
        : Buffer.from(metaidData.body, metaidData?.encoding ?? 'utf-8')
    res2.push(body)
  }
  return [...res1, ...res2]
}
export async function process({
  tasks,
  broadcast = true,
  feeb,
}: {
  tasks: TransferTask[]
  broadcast?: boolean
  feeb?: number
}) {
  const network: API_NET = (await getNetwork()) as API_NET
  const chianWallet = await getCurrentWallet(Chain.MVC)
  const purse = chianWallet.getPrivateKey()
  const address = chianWallet.getAddress()
  if (!feeb) {
    feeb = await getDefaultMVCTRate()
  }

  const wallet = new Wallet(purse, network, feeb, API_TARGET.APIMVC)
  const ftManager = new FtManager({
    network,
    apiTarget: API_TARGET.APIMVC,
    purse,
    feeb,
  })

  // 串行执行
  type TransferResult = {
    id: number
    txid: string
    txHex: string
    routeCheckTxid?: string
    routeCheckTxHex?: string
  }
  const results: TransferResult[] = []
  const txids: string[] = []
  let theUtxo:
    | {
        txId: string
        outputIndex: number
        satoshis: number
        address: string
        height: number
        wif: string
      }
    | undefined = undefined
  let fts: {
    genesis: string
    txId: string
    outputIndex: number
    tokenAddress: string
    tokenAmount: string
    wif: string
  }[] = []

  for (let i = 0; i < tasks.length; i++) {
    //If it contains multiple tasks, it is a batch transfer; We pass down the utxo from the previous task.

    const task = tasks[i]
    const id = i + 1
    // 如果有genesis，则说明是ft；

    if (task.genesis) {
      const { txHex, routeCheckTxHex, txid, tx, routeCheckTx } = await ftManager.transfer({
        codehash: task.codehash!,
        genesis: task.genesis,
        receivers: task.receivers,
        senderWif: purse,
        noBroadcast: !broadcast,
        // ftUtxos: foundFt ? [foundFt] : undefined,
        utxos: theUtxo ? [theUtxo] : undefined,
        opreturnData: task.metaidData ? buildOpReturnV2(task.metaidData) : undefined,
      })
      const routeCheckTxid = routeCheckTx.id
      results.push({
        id,
        txid,
        txHex,
        routeCheckTxHex,
        routeCheckTxid,
      })
      txids.push(routeCheckTxid)
      txids.push(txid)
      theUtxo = {
        txId: txid,
        outputIndex: tx.outputs.length - 1,
        satoshis: tx.outputs[tx.outputs.length - 1].satoshis,
        address,
        height: -1,
        wif: purse,
      }

      // fts.push({
      //   genesis: task.genesis,
      //   txId: txid,
      //   outputIndex: tx.outputs.length - 2,
      //   tokenAddress: address,
      //   tokenAmount: leftFtAmount,
      //   wif: purse,
      // })
    } else {
      const receiversWithNumericAmount = task.receivers.map((receiver) => ({
        ...receiver,
        amount: Number(receiver.amount),
      }))

      const utxos: any = theUtxo ? [theUtxo] : undefined
      const transferRes = await wallet.sendArray(receiversWithNumericAmount, utxos, {
        noBroadcast: !broadcast,
      })
      results.push({
        id,
        txid: transferRes.txId,
        txHex: transferRes.txHex,
      })
      txids.push(transferRes.txId)
      const resTx = new mvc.Transaction(transferRes.txHex)
      theUtxo = {
        txId: transferRes.txId,
        outputIndex: resTx.outputs.length - 1,
        satoshis: resTx.outputs[resTx.outputs.length - 1].satoshis,
        address,
        height: -1,
        wif: purse,
      }
    }
  }

  return { res: results, txids, broadcasted: broadcast }
}

// export async function estimate({
//   receivers,
// }: {
//   codehash: string
//   genesis: string
//   receivers: {
//     address: string
//     amount: string
//   }[]
// }) {
//   const network: API_NET = await getNetwork()
//   const purse = await getCurrentAccount().then((account) => account.privateKey.toString())
//   const apiHost = network === API_NET.MAIN ? METASV_HOST : METASV_TESTNET_HOST

//   const ftManager = new FtManager({
//     network,
//     apiTarget: API_TARGET.METALET,
//     purse,
//     feeb: FEEB,
//     apiHost,
//   })

//   return ftManager.getTransferEstimateFee({
//     codehash,
//     genesis,
//     receivers,
//     senderWif: purse,
//   })
// }
