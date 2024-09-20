import { getBtcNetwork } from './network'
import { getCurrentWallet } from './wallet'
import { Psbt, Transaction } from 'bitcoinjs-lib'
import { decipherRuneScript, fetchRuneUtxoDetail } from '@/queries/runes'
import { Chain, getAddressFromScript } from '@metalet/utxo-wallet-service'

export async function parsePsbt(psbtHex: string) {
  const btcNetwork = getBtcNetwork()
  const wallet = await getCurrentWallet(Chain.BTC)
  const psbt = Psbt.fromHex(psbtHex, { network: btcNetwork })

  const inputs = []
  const outputs = []
  let myInputValue = 0
  let totalInputValue = 0
  let totalOutputValue = 0
  let changeOutputValue = 0

  for (let index = 0; index < psbt.data.inputs.length; index++) {
    const inputData = psbt.data.inputs[index]
    const runes = await fetchRuneUtxoDetail(
      Buffer.from(psbt.txInputs[index].hash).reverse().toString('hex'),
      psbt.txInputs[index].index
    )
    let address = ''
    let value = 0
    if (inputData?.witnessUtxo?.script) {
      address = getAddressFromScript(inputData.witnessUtxo.script, btcNetwork)
      value = inputData.witnessUtxo?.value || 0
    }
    if (inputData?.nonWitnessUtxo) {
      const tx = Transaction.fromBuffer(inputData.nonWitnessUtxo)
      const output = tx.outs[psbt.txInputs[index].index]
      address = getAddressFromScript(output.script, btcNetwork)
      value = output.value
    }
    inputs.push({ address, value, runes })
    totalInputValue += value
    if (address === wallet.getAddress()) {
      myInputValue += value
    }
  }

  for (let index = 0; index < psbt.txOutputs.length; index++) {
    const out = psbt.txOutputs[index]
    console.log('out:', out)

    let script = out.script.toString('hex')
    try {
      if (out.address === undefined) {
        out.address = getAddressFromScript(out.script, btcNetwork)
        script = ''
      } else if (getAddressFromScript(out.script, btcNetwork) === out.address) {
        script = ''
      }
    } catch (error) {
      //   console.log('No address script:', error)
    }

    if (script) {
      try {
        // FIXME: request error
        script = await decipherRuneScript(out.script.toString('hex'))
      } catch (error) {
        // console.log('No rune script:', error)
      }
    }

    outputs.push({
      script,
      value: out.value,
      address: out.address || '',
    })
    
    totalOutputValue += out.value
    if (out.address === wallet.getAddress()) {
      changeOutputValue += out.value
    }
  }

  const fee = totalInputValue - totalOutputValue
  const transferAmount = myInputValue - changeOutputValue

  return {
    fee,
    psbt,
    inputs,
    outputs,
    transferAmount,
  }
}
