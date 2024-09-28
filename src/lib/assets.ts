import tokens from '@/data/tokens'
import { getCurrentWallet } from './wallet'
import { fetchMVCTokens } from '@/queries/tokens'
import { getCurrentAccount, setAccount, getAddress } from './account'
import { Chain } from '@metalet/utxo-wallet-service'

export async function getAssetsDisplay() {
  const account = await getCurrentAccount()

  if (!account) return []

  const assetsDisplay = account.assetsDisplay || []

  return assetsDisplay
}

export function isOfficialToken(genesis: string) {
  return tokens.some((token) => token.genesis === genesis)
}

// add
export async function addAssetsDisplay(asset: string) {
  const account = await getCurrentAccount()

  if (!account) return null

  const assetsDisplay = account.assetsDisplay || []

  if (assetsDisplay.includes(asset)) return

  assetsDisplay.push(asset)
  account.assetsDisplay = assetsDisplay
  await setAccount(account)
}

// remove
export async function removeAssetsDisplay(asset: string) {
  const account = await getCurrentAccount()

  if (!account) return null

  const assetsDisplay = account.assetsDisplay || []

  const index = assetsDisplay.indexOf(asset)
  if (index > -1) {
    assetsDisplay.splice(index, 1)
  }

  account.assetsDisplay = assetsDisplay
  await setAccount(account)
}

export async function getTokenBalance() {
  const wallet = await getCurrentWallet(Chain.MVC)
  const address = wallet.getAddress()
  return await fetchMVCTokens(address)
}

type AssetsManager = {
  getTokenBalance: () => Promise<any>
}

const assetsManager: AssetsManager = {
  getTokenBalance,
}

export default assetsManager
