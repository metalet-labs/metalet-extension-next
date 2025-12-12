import { mvc } from 'meta-contract'
import useStorage from '@/lib/storage'
import { decrypt, signMessage } from '@/lib/crypto'
import { fetchUtxos } from '@/queries/utxos'
import { notifyContent } from '@/lib/notify-content'
import { generateRandomString } from '@/lib/helpers'
import { getBtcNetwork, getNetwork } from '@/lib/network'
import { getActiveWalletOnlyAccount, getCurrentWallet, getV3EncryptedWallets } from './wallet'
import type { V1Account, V2Account, Chain, ChainDetail, CoreChain } from './types'
import { ScriptType, Chain as UtxoChain } from '@metalet/utxo-wallet-service'
import { fetchSpaceBalance, fetchBtcBalance, doNothing } from '@/queries/balance'
import { deriveSigner, deriveAddress, derivePublicKey, inferAddressType, derivePrivateKey } from '@/lib/bip32-deriver'
import { getPassword } from './lock'

const CURRENT_WALLET_ID = 'currentWalletId'

// import { getCurrentWalletId, hasWallets } from './wallet'

// export { getCurrentWalletId, hasWallets }
export async function getCurrentWalletId() {
  return await storage.get(CURRENT_WALLET_ID)
}

export { V2Account as Account }

const CURRENT_ACCOUNT_ID = 'currentAccountId'
const V0_ACCOUNT_STORAGE_KEY = 'currentAccount'
const V1_ACCOUNTS_STORAGE_KEY = 'accounts'
const V2_ACCOUNTS_STORAGE_KEY = 'accounts_v2'
// const ACCOUNTS_STORAGE_CURRENT_KEY = V3_ACCOUNTS_STORAGE_KEY
// const ACCOUNT_STORAGE_HISTORY_KEYS = [V1_ACCOUNTS_STORAGE_KEY, V2_ACCOUNTS_STORAGE_KEY]

const storage = useStorage()

// Account Map Serialization
function serializeAccountMap(map: Map<string, V2Account>): string {
  const obj: { [key: string]: V2Account } = {}
  for (const [key, value] of map.entries()) {
    obj[key] = value
  }
  return JSON.stringify(obj)
}

// Account Map Deserialization
function deserializeAccountMap(accounts: Record<string, V2Account>): Map<string, V2Account> {
  const map = new Map()
  for (const key in accounts) {
    map.set(key, accounts[key])
  }
  return map
}

interface SyncCurrentAccount {
  address: string
  mnemonicStr: string
  alias?: string
}

export async function hasV0Account(): Promise<boolean> {
  // TODO: get IndexDB data
  const storage = useStorage('sync')
  return !!(await storage.get<SyncCurrentAccount>(V0_ACCOUNT_STORAGE_KEY))
}

export async function getV0Account(): Promise<SyncCurrentAccount | undefined> {
  //TODO: get IndexDB data
  const storage = useStorage('sync')
  return await storage.get<SyncCurrentAccount>(V0_ACCOUNT_STORAGE_KEY)
}

export async function hasLegacyAccounts(): Promise<boolean> {
  return !!(await storage.get<Record<string, V1Account>>(V1_ACCOUNTS_STORAGE_KEY))
}

export async function getLegacyAccountsObj(): Promise<Record<string, V1Account>> {
  return await storage.get<Record<string, V1Account>>(V1_ACCOUNTS_STORAGE_KEY, {
    defaultValue: {},
  })
}

export async function getLegacyAccounts(): Promise<V1Account[]> {
  const v1Accounts = await getLegacyAccountsObj()
  return Object.values(v1Accounts)
}

export async function hasV2Accounts(): Promise<boolean> {
  return !!(await storage.get<Record<string, V2Account>>(V2_ACCOUNTS_STORAGE_KEY))
}

export async function getV2AccountsObj(): Promise<Record<string, V2Account>> {
  return await storage.get<Record<string, V2Account>>(V2_ACCOUNTS_STORAGE_KEY, {
    defaultValue: {},
  })
}

export async function getV2Accounts() {
  const v2Accounts = await getV2AccountsObj()
  return deserializeAccountMap(v2Accounts)
}

export async function setV2Accounts(accountsMap: Map<string, V2Account>) {
  await storage.set(V2_ACCOUNTS_STORAGE_KEY, serializeAccountMap(accountsMap))
}

export async function getAccountsVersionKey(): Promise<string> {
  return V2_ACCOUNTS_STORAGE_KEY
}

export async function getAccounts(): Promise<Map<string, V2Account>> {
  const currentKey = await getAccountsVersionKey()
  const accounts = await storage.get<Record<string, V2Account>>(currentKey, {
    defaultValue: {},
  })
  return deserializeAccountMap(accounts)
}

export async function getAccount(accountId: string): Promise<V2Account | undefined> {
  const accounts = await getAccounts()
  if (accounts.size === 0) {
    return
  }

  const account = accounts.get(accountId)
  if (!account) {
    return
  }

  return account
}

export async function getCurrentAccountId() {
  const currentAccountId = await storage.get(CURRENT_ACCOUNT_ID)
  if (!currentAccountId) {
    const wallets = await getV3EncryptedWallets()
    if (wallets.length && wallets[0].accounts.length) {
      await setCurrentAccountId(wallets[0].accounts[0].id)
      return wallets[0].accounts[0].id
    }
  }
  return currentAccountId
}

export async function setCurrentAccountId(accountId: string) {
  return await storage.set(CURRENT_ACCOUNT_ID, accountId)
}

export async function getCurrentAccount() {
  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    return
  }
  return await getAccount(currentAccountId)
}

export async function removeCurrentAccount(): Promise<boolean> {
  const accounts = await getAccounts()
  if (accounts.size === 0) {
    return false
  }

  const currentAccountId = await getCurrentAccountId()
  if (!currentAccountId) {
    return false
  }
  const currentAccount = accounts.get(currentAccountId)
  if (!currentAccount) {
    return false
  }

  accounts.delete(currentAccountId)
  await storage.delete(CURRENT_ACCOUNT_ID)
  setAccounts(accounts)
  return true
}

export async function connectAccount(accountId: string) {
  const _currentAccount = await getAccount(accountId)
  if (!_currentAccount) {
    return false
  }

  await storage.set(CURRENT_ACCOUNT_ID, accountId)

  const mvcAddress = await getAddress('mvc')
  const btcAddress = await getAddress('btc')
  notifyContent('accountsChanged')({ mvcAddress, btcAddress })

  return true
}

export async function setAccounts(accountsMap: Map<string, V2Account>): Promise<void> {
  const currentKey = await getAccountsVersionKey()
  await storage.set(currentKey, serializeAccountMap(accountsMap))
}

export async function setAccount(account: V2Account) {
  const accounts = await getAccounts()
  accounts.set(account.id, account)
  setAccounts(accounts)
}

export async function addAccount(newAccount: Omit<V2Account, 'id' | 'name'>) {
  const accounts = await getAccounts()

  const { mnemonic } = newAccount
  let id: string
  let account = [...accounts.values()].find((account) => account.mnemonic === mnemonic)

  if (!account) {
    id = generateRandomString(32)
    await setAccount({
      ...newAccount,
      id,
      name: `Account ${accounts.size + 1}`,
    })
  } else {
    id = account.id
  }
  await connectAccount(id)
}

async function getAccountProperty(chain: CoreChain, key: keyof ChainDetail[CoreChain]): Promise<string> {
  const account = await getCurrentAccount()

  if (!account) {
    return ''
  }

  return account[chain][key]
}

export async function getAddress(chain: Chain = 'mvc', path?: string, password?: string): Promise<string> {
  const addressIndex = path ? Number(path.charAt(path.length - 1)) : undefined
  const wallet = await getCurrentWallet(chain as UtxoChain, { addressIndex, password })
  return wallet.getAddress()
}

export async function getAddressType(chain: CoreChain = 'mvc'): Promise<string> {
  return getAccountProperty(chain, 'addressType')
}

export async function getMvcRootPath(options?: {
    mnemonic?: string
    password?: string
    addressIndex?: number
  }): Promise<string> {
  const mvcWallet = await getCurrentWallet(UtxoChain.MVC, options)
  const mvcFullPath = mvcWallet.getPath()

  return mvcFullPath.split("/").slice(0, -2).join("/")//.slice(0, mvcFullPath.length - 4)
}

export async function getPrivateKey(chain: CoreChain = 'mvc') {
  const network = await getNetwork()
  const path = await getAccountProperty(chain, 'path')
  const mnemonic = await getCurrentAccount().then((account) => account!.mnemonic)

  return derivePrivateKey({ mnemonic, chain, network, path })
}

export async function getSigner(chain: UtxoChain, treehash?: string) {
  const wallet = await getCurrentWallet(chain)
  if (wallet.getScriptType() === ScriptType.P2TR) {
    return wallet.tweak(treehash)
  }
  const btcNetwork = await getBtcNetwork()
  return deriveSigner(wallet.getPrivateKey(), btcNetwork)
}

export async function getCredential({
  chain = UtxoChain.BTC,
  message = 'metalet.space',
  encoding = 'base64',
}: {
  chain?: UtxoChain
  message?: string
  encoding?: BufferEncoding
}): Promise<{ address: string; publicKey: string; signature: string }> {
  // TODO： Saving in memory
  let signature = ''
  const wallet = await getCurrentWallet(chain)
  if (chain === UtxoChain.BTC) {
    signature = wallet.signMessage(message, encoding)
  } else if (chain === UtxoChain.MVC) {
    const wif = wallet.getPrivateKey()
    const privateKey = mvc.PrivateKey.fromWIF(wif)
    const { signature: _signature } = signMessage(message, privateKey)
    signature = _signature
  }

  return {
    signature,
    address: wallet.getAddress(),
    publicKey: wallet.getPublicKey().toString('hex'),
  }
}

export async function getPublicKey(chain: CoreChain = 'mvc', path?: string): Promise<string> {
  const network = await getNetwork()
  const mnemonic = await getCurrentAccount().then((account) => account!.mnemonic)

  if (!path) {
    const fullPath = await getAccountProperty(chain, 'path')

    return derivePublicKey({ mnemonic, chain, network, path: fullPath })
  }

  // derive mvc public key by path
  try {
    const rootPath = await getMvcRootPath()
    const concatPath = `${rootPath}/${path}`

    const mneObj = mvc.Mnemonic.fromString(mnemonic)
    const hdpk = mneObj.toHDPrivateKey('', network)
    const privateKey = hdpk.deriveChild(concatPath).privateKey

    return privateKey.toPublicKey().toString()
  } catch (e: any) {
    throw new Error(e.message)
  }
}

export async function getXPublicKey(password?: string) {
  password = password ?? (await getPassword())
  const activeWallet = await getActiveWalletOnlyAccount()
  const network = await getNetwork()
  const mnemonic = decrypt(activeWallet.mnemonic, password)
  const mneObj = mvc.Mnemonic.fromString(mnemonic)
  const mvcWallet = await getCurrentWallet(UtxoChain.MVC, { mnemonic })
  const rootPath = mvcWallet.getPath()
  const xPublicKey = mneObj
    .toHDPrivateKey('', network)
    .deriveChild(rootPath.slice(0, rootPath.length - 4))
    .xpubkey.toString()
  return xPublicKey
}

export async function getBalance(chain: UtxoChain, password?: string) {
  const wallet = await getCurrentWallet(chain, { password })
  const address = wallet.getAddress()

  switch (chain) {
    case UtxoChain.MVC:
      return fetchSpaceBalance(address)
    case UtxoChain.BTC:
      return fetchBtcBalance(address)
    default: {
      return doNothing()
    }
  }
}

export async function getUtxos(chain: Chain = 'mvc', params?: { path?: string }, password?: string) {
  const address = await getAddress(chain, params?.path, password)
  return await fetchUtxos(chain, address)
}

export async function updateName(name: string) {
  const account = await getCurrentAccount()
  if (!account) {
    return
  }

  account.name = name
  await setAccount(account)
}

export async function updateBtcPath(path: string) {
  const account = await getCurrentAccount()
  if (!account) {
    return
  }

  // derive new address
  const mnemonic = account.mnemonic
  const mainnetAddress = deriveAddress({ mnemonic, chain: 'btc', network: 'mainnet', path })
  const testnetAddress = deriveAddress({ mnemonic, chain: 'btc', network: 'testnet', path })
  account.btc = {
    path,
    addressType: inferAddressType(path),
    mainnetAddress,
    testnetAddress,
  }

  await setAccount(account)
}

export async function needsMigrationV2(): Promise<boolean> {
  const v1Records = await getLegacyAccounts()
  const v2Records = await getAccounts()

  // find out if there are any old records that exists in v1 but not in v2, judged by mnemonic
  const v1Mnemonics = v1Records.map((record) => record.mnemonic)
  const v2Mnemonics = Array.from(v2Records.values()).map((record) => record.mnemonic)

  return v1Mnemonics.some((mne) => !v2Mnemonics.includes(mne))
}
