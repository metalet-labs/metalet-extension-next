import useStorage from './storage'
import { mvc } from 'meta-contract'
import { encrypt, decrypt } from './crypto'
import { toast } from '@/components/ui/toast'
import { generateRandomString } from './helpers'
import { type DerivedAccountDetail } from '@/lib/types'
import { AddressType, deriveAllAddresses } from './bip32-deriver'
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

export const ACCOUNT_Sync_Migrated_KEY = 'accounts_sync_migrated'
export const ACCOUNT_V1_Migrated_KEY = 'accounts_v1_migrated'
export const ACCOUNT_V2_Migrated_KEY = 'accounts_v2_migrated'
export const ACCOUNT_V2_Encrypted_KEY = 'accounts_v2_encrypted'
export const Error_Accounts_Migrate_Log_Key = 'error_accounts_migrate_log'

const storage = useStorage()

type MigrateErrorVersion = 'V0' | 'V1' | 'V2'

interface MigrateErrorAccount {
  timeStamp: number
  version: MigrateErrorVersion
  mnemonic: string
  storage: string
  errorLog: string
}

const getMigrateErrorAccounts = async (): Promise<MigrateErrorAccount[]> => {
  return await storage.get<MigrateErrorAccount[]>(Error_Accounts_Migrate_Log_Key, { defaultValue: [] })
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
            addressType: 'P2PKH' as AddressType,
            mainnetAddress: allAddresses.mvcMainnetAddress,
            testnetAddress: allAddresses.mvcTestnetAddress,
          },
          btc: {
            path: fullPath,
            addressType: 'P2PKH' as AddressType,
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
  return false
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
    if (!(await getCurrentAccountId())) {
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

export async function needMigrate() {
  return (await needMigrateV1ToV2()) || (await needMigrateV0ToV2())
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

export async function migrateToV3() {}

export async function encryptV2Accounts(password: string): Promise<void> {
  const v2Accounts = await getV2AccountsObj()
  console.log('v2Accounts', v2Accounts)

  const encryptedText = encrypt(JSON.stringify(v2Accounts), password)
  console.log('encryptedText', encryptedText)

  const decryptedText = decrypt(encryptedText, password)
  console.log('decryptedText', decryptedText)
  console.log('JSON decryptedText', JSON.parse(decryptedText))
}
