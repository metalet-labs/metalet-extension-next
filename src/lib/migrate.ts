import useStorage from './storage'
import { mvc } from 'meta-contract'
import { encrypt, decrypt } from './crypto'
import { toast } from '@/components/ui/toast'
import { generateRandomString } from './helpers'
import { V3Wallet, type DerivedAccountDetail } from '@/lib/types'
import { getBackupV3Wallet, setBackupV3Wallet } from './backup'
import { AddressType, Chain } from '@metalet/utxo-wallet-service'
import { AddressTypeRecord, migrateV3AddressTypeStorage } from './addressType'
import { AddressType as ScriptType, deriveAllAddresses } from './bip32-deriver'
import {
  MigrateErrorVersion,
  MigrateErrorAccount,
  ACCOUNT_Sync_Migrated_KEY,
  ACCOUNT_V1_Migrated_KEY,
  ACCOUNT_V2_Migrated_KEY,
  ACCOUNT_V3_Encrypted_KEY,
  V3_ENCRYPTED_WALLETS_STORAGE_KEY,
  Error_Accounts_Migrate_Log_Key,
} from '@/lib/storage/key'
import {
  getV3Wallets,
  setV3WalletsNum,
  getV3WalletsStorage,
  setV3WalletsStorage,
  setCurrentWalletId,
  getV3EncryptedWallets,
  setV3EncryptedWalletsStorage,
} from '@/lib/wallet'
import {
  type Account,
  hasV0Account,
  getV0Account,
  getV2Accounts,
  setV2Accounts,
  connectAccount,
  getV2AccountsObj,
  getLegacyAccounts,
  getCurrentAccountId,
} from './account'
import { getPassword } from './lock'

const storage = useStorage()

const getMigrateErrorAccounts = async (): Promise<MigrateErrorAccount[]> => {
  return await storage.get<MigrateErrorAccount[]>(Error_Accounts_Migrate_Log_Key, { defaultValue: [] })
}

const setMigrateErrorAccounts = async (errorLogs: MigrateErrorAccount[]) => {
  return await storage.set(Error_Accounts_Migrate_Log_Key, JSON.stringify(errorLogs))
}

const addMigrateErrorAccount = async (
  mnemonic: string,
  storage: string,
  version: MigrateErrorVersion,
  errorLog: string
): Promise<void> => {
  const errorAccounts = await getMigrateErrorAccounts()
  errorAccounts.push({
    timeStamp: Date.now(),
    version,
    mnemonic,
    storage,
    errorLog,
  })
  setMigrateErrorAccounts(errorAccounts)
}

enum MigrateResultCode {
  SUCCESS = 1,
  UNDO = 0,
  FAILED = -1,
}

interface MigrateResult {
  code: MigrateResultCode
  message: string
}

async function needMigrateV0ToV2(): Promise<boolean> {
  if (await storage.get(ACCOUNT_Sync_Migrated_KEY)) {
    return false
  }
  const needed = await hasV0Account()
  if (!needed) {
    await storage.set(ACCOUNT_Sync_Migrated_KEY, true)
  }
  return needed
}

async function needMigrateV1ToV2(): Promise<boolean> {
  if (await storage.get(ACCOUNT_V1_Migrated_KEY)) {
    return false
  }
  const v1Records = await getLegacyAccounts()
  const v2Records = await getV2Accounts()
  const v1Mnemonics = v1Records.map((record) => record.mnemonic)
  const v2Mnemonics = Array.from(v2Records.values()).map((record) => record.mnemonic)
  const needed = v1Mnemonics.some((mne) => !v2Mnemonics.includes(mne))
  if (!needed) {
    await storage.set(ACCOUNT_V1_Migrated_KEY, true)
  }
  return needed
}

async function needMigrateV2ToV3(): Promise<boolean> {
  if (await storage.get(ACCOUNT_V2_Migrated_KEY)) {
    return false
  }
  const v2Records = await getV2Accounts()
  const v2Mnemonics = Array.from(v2Records.values()).map((record) => record.mnemonic)
  const v3Wallets = await getV3Wallets()
  const v3Mnemonics = v3Wallets.map((record) => record.mnemonic)
  const needed = v2Mnemonics.some((mne) => !v3Mnemonics.includes(mne))

  if (!needed) {
    await storage.set(ACCOUNT_V2_Migrated_KEY, true)
  }
  return needed
}

async function needEncryptV3(): Promise<boolean> {
  if (await storage.get(ACCOUNT_V3_Encrypted_KEY)) {
    return false
  }
  const v3Wallets = await getV3Wallets()
  const v3EncryptedWallets = await getV3EncryptedWallets()
  const v3EncryptedMnemonics = v3EncryptedWallets.map((encryptedWallet) => encryptedWallet.mnemonic)
  const password = await getPassword()
  const needed = v3Wallets.some((wallet) => !v3EncryptedMnemonics.includes(encrypt(wallet.mnemonic, password)))

  console.log('needEncryptV3', needed)

  if (!needed) {
    await storage.set(ACCOUNT_V3_Encrypted_KEY, true)
  }
  return needed
}

async function migrateSyncToV2(): Promise<MigrateResult> {
  const v0Record = await getV0Account()
  if (v0Record) {
    const { address, mnemonicStr, alias } = v0Record
    if (!mnemonicStr) {
      const errorLog = 'Mnemonic is empty.'
      await storage.set(ACCOUNT_Sync_Migrated_KEY, true)
      await addMigrateErrorAccount(mnemonicStr, v0Record.toString(), 'V0', errorLog)
      return {
        code: MigrateResultCode.FAILED,
        message: errorLog,
      }
    }
    if (!address) {
      const errorLog = 'Address is empty.'
      await storage.set(ACCOUNT_Sync_Migrated_KEY, true)
      await addMigrateErrorAccount(mnemonicStr, v0Record.toString(), 'V0', errorLog)
      return {
        code: MigrateResultCode.FAILED,
        message: errorLog,
      }
    }
    let usingPath = ''
    const mneObj = mvc.Mnemonic.fromString(mnemonicStr)
    const commonPaths = ['236', '10001']
    const network = address.startsWith('1') ? 'mainnet' : 'testnet'
    for (const path of commonPaths) {
      const hdpk = mneObj.toHDPrivateKey('', network)
      const privateKey = hdpk.deriveChild(`m/44'/${path}'/0'/0/0`).privateKey
      const derivedAddress = privateKey.toAddress(network).toString()
      if (address === derivedAddress) {
        usingPath = path
        const v2Records = await getV2Accounts()
        const v2Account = Array.from(v2Records.values()).find((account) => account.mnemonic === mnemonicStr)
        if (v2Account) {
          await storage.set(ACCOUNT_Sync_Migrated_KEY, true)
          return {
            code: MigrateResultCode.UNDO,
            message: `Account already exists.`,
          }
        }
        const fullPath = `m/44'/${usingPath}'/0'/0/0`
        const allAddresses = deriveAllAddresses({
          mnemonic: mnemonicStr,
          btcPath: fullPath,
          mvcPath: fullPath,
        })
        const id = generateRandomString(32)
        const rndNameId = generateRandomString(4)
        const account = {
          id,
          name: alias || `Account#${rndNameId}`,
          mnemonic: mnemonicStr,
          assetsDisplay: ['SPACE', 'BTC'],
          mvc: {
            path: fullPath,
            addressType: 'P2PKH' as ScriptType,
            mainnetAddress: allAddresses.mvcMainnetAddress,
            testnetAddress: allAddresses.mvcTestnetAddress,
          },
          btc: {
            path: fullPath,
            addressType: 'P2PKH' as ScriptType,
            mainnetAddress: allAddresses.btcMainnetAddress,
            testnetAddress: allAddresses.btcTestnetAddress,
          },
        } as Account
        v2Records.set(id, account)
        await setV2Accounts(v2Records)
        if (!(await getCurrentAccountId)) {
          connectAccount(id)
        }
        await storage.set(ACCOUNT_Sync_Migrated_KEY, true)
        return {
          code: MigrateResultCode.SUCCESS,
          message: `V0 account migrated successfully.`,
        }
      }
    }

    // can not find path
    const errorLog = 'Path is not found.'
    await addMigrateErrorAccount(mnemonicStr, v0Record.toString(), 'V0', errorLog)
    await storage.set(ACCOUNT_Sync_Migrated_KEY, true)
    return {
      code: MigrateResultCode.FAILED,
      message: errorLog,
    }
  }
  await storage.set(ACCOUNT_Sync_Migrated_KEY, true)
  return {
    code: MigrateResultCode.UNDO,
    message: 'No cache, no migration needed.',
  }
}

async function migrateV1ToV2(): Promise<MigrateResult> {
  const v1Accounts = await getLegacyAccounts()
  const v2Accounts = await getV2Accounts()
  const v2AccountsArr = Array.from(v2Accounts.values())

  let successfulMigrations = 0
  let skippedMigrations = 0
  let failedMigrations = 0
  let totalAccounts = v1Accounts.length

  for (const v1Account of v1Accounts) {
    try {
      const accountHasMigrated = v2AccountsArr.some((account) => account.mnemonic === v1Account.mnemonic)

      if (accountHasMigrated) {
        skippedMigrations++
        continue
      }

      const deriveChainPath = v1Account.path
      const path = `m/44'/${deriveChainPath}'/0'/0/0`
      const rndNameId = generateRandomString(4)

      const allAddresses = deriveAllAddresses({
        mnemonic: v1Account.mnemonic,
        btcPath: path,
        mvcPath: path,
      })

      const newAccount = {
        id: v1Account.id,
        name: v1Account.name || `Account#${rndNameId}`,
        mnemonic: v1Account.mnemonic,
        assetsDisplay: ['SPACE', 'BTC'],
        mvc: {
          path,
          addressType: 'P2PKH',
          mainnetAddress: allAddresses.mvcMainnetAddress,
          testnetAddress: allAddresses.mvcTestnetAddress,
        } as DerivedAccountDetail,
        btc: {
          path,
          addressType: 'P2PKH',
          mainnetAddress: allAddresses.btcMainnetAddress,
          testnetAddress: allAddresses.btcTestnetAddress,
        } as DerivedAccountDetail,
      }
      v2Accounts.set(v1Account.id, newAccount)
      successfulMigrations++
    } catch (e: any) {
      await addMigrateErrorAccount(v1Account.mnemonic, v1Account.toString(), 'V1', e)
      failedMigrations++
      continue
    }
  }

  if (successfulMigrations > 0) {
    await setV2Accounts(v2Accounts)
    const accounts = await getV2Accounts()
    const currentAccountId = await getCurrentAccountId()
    if (!currentAccountId || !accounts.get(currentAccountId)) {
      const firstAccount = Array.from(v2Accounts.values()).shift()!
      await connectAccount(firstAccount.id)
    }
  }
  await storage.set(ACCOUNT_V1_Migrated_KEY, true)

  let code = MigrateResultCode.UNDO
  if (failedMigrations === totalAccounts) {
    code = MigrateResultCode.FAILED
  } else if (successfulMigrations > 0 && failedMigrations === 0) {
    code = MigrateResultCode.SUCCESS
  }
  return {
    code,
    message: `
    Migration Summary:\n
    - Total Accounts Processed: ${totalAccounts}\n
    - Successful Migrations: ${successfulMigrations}\n
    - Accounts Already Exist (Skipped): ${skippedMigrations}\n
    - Failed Migrations: ${failedMigrations}
    `,
  }
}

export async function migrateToV2() {
  // Note: Migrate to higher versions first
  if (await needMigrateV1ToV2()) {
    const title = 'Migrate V1 account'
    const { code, message: description } = await migrateV1ToV2()
    if (code === MigrateResultCode.FAILED) {
      toast({ title, toastType: 'fail', description })
    } else if (code === MigrateResultCode.SUCCESS) {
      toast({ title, toastType: 'success', description })
    } else if (code === MigrateResultCode.UNDO) {
      toast({ title, toastType: 'info', description })
    }
  }
  if (await needMigrateV0ToV2()) {
    const title = 'Migrate V0 account'
    const { code, message } = await migrateSyncToV2()
    if (code === MigrateResultCode.FAILED) {
      toast({ title, toastType: 'fail', description: message })
    } else if (code === MigrateResultCode.SUCCESS) {
      toast({ title, toastType: 'success', description: message })
    }
  }
}

export async function needMigrate() {
  return (
    (await needMigrateV1ToV2()) || (await needMigrateV0ToV2()) || (await needMigrateV2ToV3()) || (await needEncryptV3())
  )
}

async function migrateV2ToV3(): Promise<MigrateResult> {
  const v2Accounts = await getV2Accounts()
  const v3WalletsStorage = await getV3WalletsStorage()
  const v3Wallets = await getV3Wallets()

  let successfulMigrations = 0
  let skippedMigrations = 0
  let failedMigrations = 0
  let totalAccounts = v2Accounts.size

  function getCoinTypeFromHDPath(hdPath: string): number {
    const parts = hdPath.split('/')
    const purposePart = parts[2]
    const coinTypePart = purposePart.replace("'", '')
    return Number(coinTypePart)
  }

  const v2AddressTypeRecord: AddressTypeRecord = {}
  const backupWalletIdList = await getBackupV3Wallet()

  for (const v2Account of v2Accounts.values()) {
    try {
      const accountHasMigrated = v3Wallets.some((wallet) => wallet.mnemonic === v2Account.mnemonic)

      if (accountHasMigrated) {
        skippedMigrations++
        continue
      }

      const coinType = getCoinTypeFromHDPath(v2Account.mvc.path)

      const mvcTypes = coinType === 10001 ? [10001] : [coinType]
      const id = generateRandomString(32)

      const wallet = {
        id,
        name: `Wallet#${generateRandomString(4)}`,
        mnemonic: v2Account.mnemonic,
        mvcTypes,
        accounts: [
          {
            id: v2Account.id,
            name: v2Account.name,
            addressIndex: 0,
          },
        ],
      }

      backupWalletIdList.push(id)

      let btcAddressType: AddressType | null = null

      switch (v2Account.btc.addressType) {
        case 'P2PKH':
          if (v2Account.btc.path === "m/44'/0'/0'/0/0") {
            btcAddressType = AddressType.Legacy
          } else {
            btcAddressType = AddressType.SameAsMvc
          }
          break
        case 'P2WPKH':
          btcAddressType = AddressType.NativeSegwit
          break
        case 'P2SH-P2WPKH':
          btcAddressType = AddressType.NestedSegwit
          break
        case 'P2TR':
          btcAddressType = AddressType.Taproot
          break
      }
      if (btcAddressType) {
        v2AddressTypeRecord[v2Account.id] = btcAddressType
      }
      v3WalletsStorage[id] = wallet
      successfulMigrations++
    } catch (e: any) {
      await addMigrateErrorAccount(v2Account.mnemonic, JSON.stringify(v2Account), 'V2', e)
      failedMigrations++
      continue
    }
  }

  await migrateV3AddressTypeStorage(Chain.BTC, v2AddressTypeRecord)

  await setBackupV3Wallet(backupWalletIdList)

  if (successfulMigrations > 0) {
    await setV3WalletsStorage(v3WalletsStorage)
  }
  const newV3Wallets = await getV3Wallets()
  let walletId = ''
  const accountId = await getCurrentAccountId()
  for (let v3Wallet of newV3Wallets) {
    if (v3Wallet.accounts.findIndex((account) => account.id === accountId) >= 0) {
      walletId = v3Wallet.id
      break
    }
  }
  if (!walletId) {
    const firstWallet = newV3Wallets.shift()!
    walletId = firstWallet.id
  }
  await setCurrentWalletId(walletId)
  await storage.set(ACCOUNT_V2_Migrated_KEY, true)

  let code = MigrateResultCode.UNDO
  if (failedMigrations === totalAccounts) {
    code = MigrateResultCode.FAILED
  } else if (successfulMigrations > 0 && failedMigrations === 0) {
    code = MigrateResultCode.SUCCESS
  }
  await setV3WalletsNum(successfulMigrations)
  return {
    code,
    message: `
    Migration Summary:\n
    - Total Accounts Processed: ${totalAccounts}\n
    - Successful Migrations: ${successfulMigrations}\n
    - Accounts Already Exist (Skipped): ${skippedMigrations}\n
    - Failed Migrations: ${failedMigrations}
    `,
  }
}

export async function migrateToV3() {
  if (await needMigrateV2ToV3()) {
    const title = 'Migrate V2 account'
    const { code, message: description } = await migrateV2ToV3()
    if (code === MigrateResultCode.FAILED) {
      toast({ title, toastType: 'fail', description })
    } else if (code === MigrateResultCode.SUCCESS) {
      toast({ title, toastType: 'success', description })
    } else if (code === MigrateResultCode.UNDO) {
      toast({ title, toastType: 'info', description })
    }
  }
}

async function encryptV3Accounts(): Promise<MigrateResult> {
  const v3Wallets = await getV3Wallets()
  const v3EncryptedWallets = await getV3EncryptedWallets()

  const encryptedMnemonics = new Set(v3EncryptedWallets.map((wallet) => wallet.mnemonic))

  let totalEncryptions = v3Wallets.length
  let successfulEncryptions = 0
  let alreadyEncryptedCount = 0
  let failedEncryptions = 0

  const password = await getPassword()

  v3Wallets.forEach((wallet) => {
    try {
      if (!encryptedMnemonics.has(encrypt(wallet.mnemonic, password))) {
        v3EncryptedWallets.push({ ...wallet, mnemonic: encrypt(wallet.mnemonic, password) })
        successfulEncryptions++
      } else {
        alreadyEncryptedCount++
      }
    } catch (e: any) {
      addMigrateErrorAccount(wallet.mnemonic, JSON.stringify(wallet), 'V3', e)
      failedEncryptions++
    }
  })

  setV3EncryptedWalletsStorage(
    v3EncryptedWallets.reduce<Record<string, V3Wallet>>((acc, wallet) => {
      acc[wallet.id] = wallet
      return acc
    }, {})
  )

  let code = MigrateResultCode.UNDO
  if (failedEncryptions === totalEncryptions) {
    code = MigrateResultCode.FAILED
  } else if (successfulEncryptions > 0 && failedEncryptions === 0) {
    code = MigrateResultCode.SUCCESS
  }

  return {
    code,
    message: `
    Encryption Summary:\n
    - Total Wallets Processed: ${totalEncryptions}\n
    - Successful Encryptions: ${successfulEncryptions}\n
    - Already Encrypted Wallets: ${alreadyEncryptedCount}\n
    - Failed Encryptions: ${failedEncryptions}
    `,
  }
}

export async function migrateToV3Encrypted() {
  if (await needEncryptV3()) {
    const title = 'Encrypt V3 wallet'
    const { code, message: description } = await encryptV3Accounts()
    if (code === MigrateResultCode.FAILED) {
      toast({ title, toastType: 'fail', description })
    } else if (code === MigrateResultCode.SUCCESS) {
      toast({ title, toastType: 'success', description })
    } else if (code === MigrateResultCode.UNDO) {
      toast({ title, toastType: 'info', description })
    }
  }
}
