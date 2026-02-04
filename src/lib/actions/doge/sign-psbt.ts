/**
 * Sign PSBT with DOGE wallet
 */

import { getDogeWallet } from './wallet'
import { getNetwork } from '@/lib/network'
import { getDogeNetwork } from '@/lib/doge/network'
import * as btcjs from 'bitcoinjs-lib'
import { Psbt, Transaction } from 'bitcoinjs-lib'

export interface ToSignInput {
  index: number
  publicKey: string
  sighashTypes?: number[]
}

interface BaseUserToSignInput {
  index: number
  sighashTypes: number[] | undefined
}

export interface AddressUserToSignInput extends BaseUserToSignInput {
  address: string
}

export interface PublicKeyUserToSignInput extends BaseUserToSignInput {
  publicKey: string
}

export type UserToSignInput = AddressUserToSignInput | PublicKeyUserToSignInput

export interface SignPsbtOptions {
  autoFinalized: boolean
  toSignInputs?: UserToSignInput[]
}

export async function process({
  psbtHex,
  options,
}: {
  psbtHex: string
  options?: { toSignInputs?: ToSignInput[]; autoFinalized: boolean }
}): Promise<string> {
  const network = await getNetwork()
  const psbtNetwork = getDogeNetwork(network)
  const wallet = await getDogeWallet()
  const pubkey = wallet.getPublicKey().toString('hex')

  if (!options) {
    options = { toSignInputs: undefined, autoFinalized: true }
  }
  if (!options?.toSignInputs) {
    // Compatibility with legacy code.
    options.toSignInputs = await formatOptionsToSignInputs(psbtHex)
    if (options.autoFinalized !== false) options.autoFinalized = true
  }

  const psbt = Psbt.fromHex(psbtHex, { network: psbtNetwork })

  // Sign inputs
  for (let i = 0; i < options.toSignInputs.length; i++) {
    const keyPair = wallet.getSigner()
    const v = options.toSignInputs[i]
    psbt.signInput(v.index, keyPair, v.sighashTypes)
  }

  if (options.autoFinalized) {
    options.toSignInputs.forEach((v) => {
      psbt.finalizeInput(v.index)
    })
  }

  return psbt.toHex()
}

const formatOptionsToSignInputs = async (_psbt: string | Psbt, options?: SignPsbtOptions) => {
  const wallet = await getDogeWallet()
  const pubkey = wallet.getPublicKey().toString('hex')
  const dogeAddress = wallet.getAddress()
  const account = { pubkey, address: dogeAddress }

  let toSignInputs: ToSignInput[] = []
  if (options && options.toSignInputs) {
    // We expect userToSignInputs objects to be similar to ToSignInput interface,
    // but we allow address to be specified in addition to publicKey for convenience.
    toSignInputs = options.toSignInputs.map((input) => {
      const index = Number(input.index)
      if (isNaN(index)) throw new Error('invalid index in toSignInput')

      if (!(input as AddressUserToSignInput).address && !(input as PublicKeyUserToSignInput).publicKey) {
        throw new Error('no address or public key in toSignInput')
      }

      if ((input as AddressUserToSignInput).address && (input as AddressUserToSignInput).address != account.address) {
        throw new Error('invalid address in toSignInput')
      }

      if (
        (input as PublicKeyUserToSignInput).publicKey &&
        (input as PublicKeyUserToSignInput).publicKey != account.pubkey
      ) {
        throw new Error('invalid public key in toSignInput')
      }

      const sighashTypes = input.sighashTypes?.map(Number)

      if (sighashTypes?.some(isNaN)) throw new Error('invalid sighash type in toSignInput')

      return {
        index,
        publicKey: account.pubkey,
        sighashTypes,
      }
    })
  } else {
    const network = await getNetwork()
    const psbtNetwork = getDogeNetwork(network)

    const psbt = typeof _psbt === 'string' ? Psbt.fromHex(_psbt as string, { network: psbtNetwork }) : (_psbt as Psbt)
    psbt.data.inputs.forEach((v, index) => {
      let script: any = null
      let value = 0
      if (v.witnessUtxo) {
        script = v.witnessUtxo.script
        value = v.witnessUtxo.value
      } else if (v.nonWitnessUtxo) {
        const tx = Transaction.fromBuffer(v.nonWitnessUtxo)
        const output = tx.outs[psbt.txInputs[index].index]
        script = output.script
        value = output.value
      }
      const isSigned = v.finalScriptSig || v.finalScriptWitness
      if (script && !isSigned) {
        const address = btcjs.address.fromOutputScript(script, psbtNetwork)
        if (account.address === address) {
          toSignInputs.push({
            index,
            publicKey: account.pubkey,
            sighashTypes: v.sighashType ? [v.sighashType] : undefined,
          })
        }
      }
    })
  }
  return toSignInputs
}
