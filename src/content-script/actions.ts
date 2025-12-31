import { UnlockP2PKHInputParams } from '@/lib/actions/unlockP2PKHInput'
import { generateRandomString } from '../lib/helpers'
import { StorageChunkParams } from '@/lib/actions/storage-chunk'

type Echo = {
  nonce: string
  channel: string
  action: string
  host: string
  res: any
}

export type ActionType = 'authorize' | 'query' | 'event' | 'inscribe'

export async function createAction(
  actionName: string,
  actionType: ActionType = 'authorize',
  params?: any,
  handler?: any
): Promise<any> {
  const action = `${actionType}-${actionName}`
  // nonce为32位随机字符串
  const nonce = generateRandomString(16)
  // 读取当前页面的host
  const host = window.location.host
  window.postMessage(
    {
      nonce,
      channel: 'to-metaidwallet',
      action,
      host,
      icon: '',
      params: params || {},
    },
    '*'
  )
  // 异步返回授权结果
  const subscribe = (callback: Function) => {
    const actionListener = (event: MessageEvent) => {
      if (event.source !== window || event.data?.channel !== 'from-metaidwallet') {
        return
      }
      if (event.data?.nonce === nonce) {
        window.removeEventListener('message', actionListener)
        // if (event.data?.res?.error) {
        //   throw new Error(event.data.res.error)
        // }
        if (callback && typeof callback === 'function') {
          callback(event.data)
        }
      }
      // return true
    }
    window.addEventListener('message', actionListener)
  }
  return await new Promise((resolve, reject) => {
    subscribe((echo: Echo) => {
      if (echo.res.error) {
        reject(echo.res.error)
      }
      resolve(echo.res)
    })
  })
}

export async function ping() {
  return await createAction('Ping', 'query')
}

export async function connect() {
  return await createAction('Connect')
}

export async function disconnect() {
  return await createAction('Disconnect')
}

export async function isConnected() {
  return await createAction('IsConnected', 'query')
}

export async function getNetwork() {
  return await createAction('GetNetwork', 'query')
}

export async function switchNetwork(params: { network?: string }) {
  return await createAction('SwitchNetwork', 'authorize', params)
}

export async function getAddress(params?: { path: string }) {
  return await createAction('GetAddress', 'query', params)
}

export async function getPublicKey(params?: { path: string }) {
  return await createAction('GetPublicKey', 'query', params)
}

/**
 * 根据自定义派生路径获取 PKH（地址）
 * 用于私密群聊场景：群主使用特定路径（如 100/0, 100/1）生成唯一的加密密钥
 * @param params.path - 相对路径，如 "100/0" 或 "100/1"
 * @param params.chain - 链类型，可选，默认 'mvc'
 * @returns PKH（地址字符串）
 * @example
 * // 群主创建第一个私密群聊
 * const pkh1 = await getPKHByPath({ path: '100/0' })
 * 
 * // 创建第二个私密群聊
 * const pkh2 = await getPKHByPath({ path: '100/1' })
 */
export async function getPKHByPath(params: { path: string; chain?: string }) {
  return await createAction('GetPKHByPath', 'query', params)
}

/**
 * 获取当前账户的 GlobalMetaId
 * GlobalMetaId 是一个跨链统一的身份标识，相同派生路径的 MVC、BTC、DOGE 地址会产生相同的 GlobalMetaId
 * @returns { globalMetaId, mvcAddress, btcAddress, dogeAddress }
 * @example
 * const result = await getGlobalMetaid()
 * console.log(result.globalMetaId) // idq1tz3ljq763lqsj2wp894h06vxn0ndhnsq3fllnj
 */
export async function getGlobalMetaid() {
  return await createAction('GetGlobalMetaid', 'query')
}

export async function getXPublicKey() {
  return await createAction('GetXPublicKey', 'query')
}

export async function getBalance(params?: { path: string }) {
  return await createAction('GetBalance', 'query', params)
}

export async function getUtxos(params?: { path: string }) {
  return await createAction('GetUtxos', 'query', params)
}

export async function eciesEncrypt(params: { message: string }) {
  return await createAction('EciesEncrypt', 'authorize', params)
}

export async function eciesDecrypt(params: { encrypted: string }) {
  return await createAction('EciesDecrypt', 'authorize', params)
}

export async function signMessage(params: { message: string }) {
  return await createAction('SignMessage', 'authorize', params)
}

export async function verifySignature(params: { message: string; signature: string }) {
  return await createAction('VerifySignature', 'query', params)
}

export async function storageChunk(params: StorageChunkParams) {
  return await createAction('StorageChunk', 'query', params)
}

type SigningTransaction = {
  txHex: string
  address: string
  inputIndex: number
  scryptHex: string
  satoshis: number
  sigtype: number
}

export async function previewTransaction(params: { transaction: SigningTransaction }) {
  return await createAction('PreviewTransaction', 'query', params)
}
export async function signTransaction(params: { transaction: SigningTransaction }) {
  return await createAction('SignTransaction', 'authorize', params)
}
export async function signTransactions(params: { transactions: SigningTransaction[] }) {
  return await createAction('SignTransactions', 'authorize', params)
}
export async function pay(params: { transactions: SigningTransaction[] }) {
  return await createAction('Pay', 'authorize', params)
}

export async function unlockP2PKHInput(params: UnlockP2PKHInputParams) {
  return await createAction('UnlockP2PKHInput', 'authorize', params)
}

export async function autoPaymentStatus() {
  return await createAction('AutoPaymentStatus', 'query')
}

export async function autoPayment() {
  return await createAction('AutoPayment', 'authorize')
}

export async function smallPay(params: { transactions: SigningTransaction[] }) {
  return await createAction('SmallPay', 'query', params)
}

export async function signPartialTx(params: {
  transactions: SigningTransaction[]
  utxos: {
    txId: string
    outputIndex: number
    satoshis: number
    address: string
    height: number
  }[]
  signType?: number
  hasMetaid?: boolean
}) {
  return await createAction('SignPartialTx', 'authorize', params)
}

type TransferTask = {
  genesis?: string
  codehash?: string
  receivers: {
    address: string
    amount: string
  }[]
}
export async function transfer(params: { tasks: TransferTask[] }) {
  return await createAction('Transfer', 'authorize', params)
}

export async function merge(params: any) {
  return await createAction('Merge', 'authorize', params)
}

export async function ecdh(params: { path?: string; externalPubKey: string }) {
  return await createAction('ECDH', 'query', params)
}

export async function omniConnect() {
  return await createAction('OmniConnect')
}

export async function transferNFT(params: {
  codehash: string
  genesis: string
  tokenIndex: string
  recipient: string
  options?: { noBroadcast?: boolean; feeRate?: string | number; useUnconfirmed?: boolean }
}) {
  return await createAction('TransferNFT', 'authorize', params)
}

// export async function transferAll(params: {
//   receivers: {
//     address: string
//     amount: string
//   }[]
// }) {
//   return await createAction('Transfer', 'authorize', params)
// }

// tokens-related
export async function getTokenBalance(params?: { genesis: string; codehash: string }) {
  return await createAction('GetTokenBalance', 'query', params)
}

// event on
export async function on(eventName: string, handler: Function) {
  const handleFn = (event: MessageEvent) => {
    if (event.data?.channel === 'removeListener' && event.data?.eventName === eventName) {
      window.removeEventListener('message', handleFn)
      return
    }
    if (event.source !== window || event.data?.channel !== 'from-metaidwallet' || event.data?.eventName !== eventName) {
      return
    }

    handler(...event.data.args)
  }

  window.addEventListener('message', handleFn)

  // add connecting dapps to list
  // return await createAction('Listen', 'query')
}

// event removeListener
export async function removeListener(eventName: string) {
  window.postMessage({ eventName, channel: 'removeListener' }, '*')
}

export interface ActionItem {
  name: string
  action: string
}

export type Keys = {
  [K in ActionType]: ActionItem[]
}

export const btcKeys: Omit<Keys, 'event'> = {
  query: [
    { name: 'getBalance', action: 'GetBTCBalance' },
    { name: 'getAddress', action: 'GetBTCAddress' },
    { name: 'getAddressType', action: 'GetBTCAddressType' },
    { name: 'getPublicKey', action: 'GetBTCPublicKey' },
    { name: 'getUtxos', action: 'GetBTCUtxos' },
    { name: 'pushPsbt', action: 'PushPsbt' },
    { name: 'verifyMessage', action: 'BTCVerifyMessage' },
    { name: 'addSafeUtxo', action: 'AddSafeUtxo' },
  ],
  authorize: [
    { name: 'connect', action: 'ConnectBTC' },
    { name: 'signPsbt', action: 'SignBTCPsbt' },
    { name: 'signMessage', action: 'SignBTCMessage' },
    { name: 'inscribe', action: 'Inscribe' },
    { name: 'transfer', action: 'BTCTransfer' },
    { name: 'deployMRC20', action: 'MRC20Deploy' },
    { name: 'mintMRC20', action: 'MRC20Mint' },
    { name: 'transferMRC20', action: 'MRC20Transfer' },
    { name: 'transferMRC20WithInscribe', action: 'MRC20TransferWithInscribe' },
    { name: 'transferUtxo', action: 'TransferUtxo' },
  ],
  inscribe: [{ name: 'inscribeTransfer', action: 'InscribeTransfer' }],
}

export const dogeKeys: Omit<Keys, 'event'> = {
  query: [
    { name: 'getBalance', action: 'GetDOGEBalance' },
    { name: 'getAddress', action: 'GetDOGEAddress' },
    { name: 'getPublicKey', action: 'GetDOGEPublicKey' },
    { name: 'getUtxos', action: 'GetDOGEUtxos' },
  ],
  authorize: [
    { name: 'inscribe', action: 'DogeInscribe' },
  ],
  inscribe: [],
}
