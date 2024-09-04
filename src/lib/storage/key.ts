// Migrate
export const ACCOUNT_Sync_Migrated_KEY = 'accounts_sync_migrated'
export const ACCOUNT_V1_Migrated_KEY = 'accounts_v1_migrated'
export const ACCOUNT_V2_Migrated_KEY = 'accounts_v2_migrated'
export const ACCOUNT_V3_Encrypted_KEY = 'accounts_v3_encrypted'
export const Error_Accounts_Migrate_Log_Key = 'error_accounts_migrate_log'
export type MigrateErrorVersion = 'V0' | 'V1' | 'V2' | 'V3'
export interface MigrateErrorAccount {
  timeStamp: number
  version: MigrateErrorVersion
  mnemonic: string
  storage: string
  errorLog: string
}

// wallet
export const BACKUP_V3_KEY = 'backup_v3'
export const CURRENT_ACCOUNT_ID = 'currentAccountId'
export const V0_ACCOUNT_STORAGE_KEY = 'currentAccount'
export const V1_ACCOUNTS_STORAGE_KEY = 'accounts'
export const V2_ACCOUNTS_STORAGE_KEY = 'accounts_v2'
export const WALLET_NUM = 'wallet_num'
export const CURRENT_WALLET_ID = 'currentWalletId'
export const V3_WALLETS_STORAGE_KEY = 'wallets_v3'
export const V3_ENCRYPTED_WALLETS_STORAGE_KEY = 'encrypted_wallets_v3'
export const V3_ENCRYPTED_WALLETS_STORAGE_BACKUP_KEY = 'encrypted_wallets_v3_backup'

// network
export const NETWORK_KEY = 'network'
export const SERVICE_NETWORK_KEY = 'service_network'

// password
export const PASSWORD_KEY = 'password'

// lock
export const LOCK_KEY = 'locked'
export const LAST_LOCK_TIME_KEY = 'last_lock_time'
