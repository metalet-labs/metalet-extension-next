import { deriveAllAddresses } from '@/lib/bip32-deriver'
import { addAssetsDisplay, getAssetsDisplay, removeAssetsDisplay } from '@/lib/assets'
import {
  getCurrentAccount,
  updateName,
  addAccount,
  getAddress,
  getPrivateKey,
  updateBtcPath,
  getAddressType,
} from '@/lib/account'

export default {
  getCurrentAccount,
  updateName,
  addAccount,
  getAddress,
  getPrivateKey,
  getAddressType,
  updateBtcPath,
  deriveAllAddresses,
  getAssetsDisplay,
  addAssetsDisplay,
  removeAssetsDisplay,
} as { [key: string]: Function }
