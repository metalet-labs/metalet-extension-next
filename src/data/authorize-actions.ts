import * as TransferToken from '../lib/actions/transfer-token'
import * as Transfer from '../lib/actions/transfer'
import * as Connect from '../lib/actions/connect'
import * as Disconnect from '../lib/actions/disconnect'
import * as SwitchNetwork from '../lib/actions/switch-network'
import * as EciesEncrypt from '../lib/actions/ecies-encrypt'
import * as EciesDecrypt from '../lib/actions/ecies-decrypt'
import * as SignTransaction from '../lib/actions/sign-transaction'
import * as SignTransactions from '../lib/actions/sign-transactions'
import * as UnlockP2PKHInput from '../lib/actions/unlockP2PKHInput'
import * as Pay from '../lib/actions/pay'
import * as SignPartialTx from '../lib/actions/signPartialTx'
import * as SignMessage from '../lib/actions/sign-message'
import * as Merge from '../lib/actions/merge'

// BTC
import * as ConnectBTC from '../lib/actions/btc/connect'
import * as SignBTCPsbt from '../lib/actions/btc/sign-psbt'
import * as SignBTCMessage from '../lib/actions/btc/sign-message'
import * as Inscribe from '../lib/actions/btc/inscribe'
import * as BTCTransfer from '../lib/actions/btc/transfer'
import * as MRC20Deploy from '../lib/actions/btc/mrc20-deploy'
import * as MRC20Mint from '../lib/actions/btc/mrc20-mint'
import * as MRC20Transfer from '../lib/actions/btc/mrc20-transfer'
import * as MRC20TransferWithInscribe from '../lib/actions/btc/mrc20-transfer-with-inscribe'
import * as TransferUtxo from '../lib/actions/btc/transfer-utxo'
import * as TransferNFT from '../lib/actions/transfer-nft'

// Common
import * as OmniConnect from '../lib/actions/common/omniConnect'

function doNothing() {}

type AuthorizeAction = {
  name: string
  title: string
  description: string | string[]
  process: Function
  estimate: Function
  closeAfterProcess: boolean
}

export default {
  Connect: {
    name: 'Connect',
    title: 'Connect',
    description: 'Connect',
    process: Connect.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },

  Disconnect: {
    name: 'Disconnect',
    title: 'Disconnect',
    description: 'Disconnect',
    process: Disconnect.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },

  SwitchNetwork: {
    name: 'SwitchNetwork',
    title: 'SwitchNetwork',
    description: 'SwitchNetwork',
    process: SwitchNetwork.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },

  TokenTransfer: {
    name: 'TokenTransfer',
    title: 'Token Transfer',
    description: 'Transfer tokens from my wallet to another',
    process: TransferToken.process,
    estimate: TransferToken.estimate,
    closeAfterProcess: false,
  },
  Transfer: {
    name: 'Transfer',
    title: 'Transfer',
    description: 'Transfer tokens from my wallet to another',
    process: Transfer.process,
    estimate: doNothing,
    closeAfterProcess: false,
  },
  Merge: {
    name: 'Merge',
    title: 'Merge',
    description: 'Merge all the UTXOs into one in my wallet',
    process: Merge.process,
    estimate: doNothing,
    closeAfterProcess: false,
  },
  SignTransaction: {
    name: 'Sign a Transaction',
    title: 'Sign a Transaction',
    description: ['Sign a transaction with my wallet'],
    process: SignTransaction.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },

  SignTransactions: {
    name: 'Sign Transactions',
    title: 'Sign Multiple Transactions',
    description: ['Sign multiple transactions with my wallet as once'],
    process: SignTransactions.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  UnlockP2PKHInput: {
    name: 'Sign a Transaction',
    title: 'Sign a Transactiont',
    description: ['Sign a transaction with my wallet'],
    process: UnlockP2PKHInput.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  Pay: {
    name: 'Pay',
    title: 'Pay for transactions',
    description: ['Third party apps create functional transaction(s), and ask Metalet to pay for them.'],
    process: Pay.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  SignPartialTx: {
    name: 'SignPartialTx',
    title: 'Partial Transaction Signing',
    description: ['Sign transactions with specified UTXOs'],
    process: SignPartialTx.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  SignBTCPsbt: {
    name: 'SignBTCPsbt',
    title: 'Sign Psbt',
    description: ['A third party app is requesting to sign the PSBT.'],
    process: SignBTCPsbt.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },

  EciesEncrypt: {
    name: 'ECIES Encrypt',
    title: 'ECIES Encrypt',
    description: 'Encrypt a message with ECIES algorithm',
    process: EciesEncrypt.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  EciesDecrypt: {
    name: 'ECIES Decrypt',
    title: 'ECIES Decrypt',
    description: ['Decrypt an encrypted message with ECIES algorithm'],
    process: EciesDecrypt.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  SignMessage: {
    name: 'Sign Message',
    title: 'Sign Message',
    description: ['Sign a message with ECDSA algorithm'],
    process: SignMessage.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },

  // BTC
  ConnectBTC: {
    name: 'Connect BTC',
    title: 'Connect Account',
    description: ['Connect Account'],
    process: ConnectBTC.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  // BTC
  BTCTransfer: {
    name: '',
    title: '',
    description: [''],
    process: BTCTransfer.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  SignBTCMessage: {
    name: 'Sign BTC Message',
    title: 'Signature request',
    description: 'Only sign this message if you fully understand the content and trust the requesting site.',
    process: SignBTCMessage.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  Inscribe: {
    name: 'Inscribe',
    title: 'Inscribe',
    description: '',
    process: Inscribe.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  MRC20Deploy: {
    name: 'MRC20Deploy',
    title: 'MRC20 Deploy',
    description: '',
    process: MRC20Deploy.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  MRC20Transfer: {
    name: 'MRC20Transfer',
    title: 'MRC20 Transfer',
    description: '',
    process: MRC20Transfer.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  MRC20TransferWithInscribe: {
    name: 'MRC20TransferWithInscribe',
    title: 'MRC20 Transfer',
    description: '',
    process: MRC20TransferWithInscribe.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  MRC20Mint: {
    name: 'MRC20Mint',
    title: 'MRC20 Mint',
    description: '',
    process: MRC20Mint.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  TransferUtxo: {
    name: 'TransferUtxo',
    title: 'Transfer Utxo',
    description: '',
    process: TransferUtxo.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
  TransferNFT: {
    name: 'TransferNFT',
    title: 'Transfer NFT',
    description: '',
    process: TransferNFT.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },

  // Common
  OmniConnect: {
    name: 'OmniConnect',
    title: 'Omni Connect',
    description: '',
    process: OmniConnect.process,
    estimate: doNothing,
    closeAfterProcess: true,
  },
} as { [key: string]: AuthorizeAction }
