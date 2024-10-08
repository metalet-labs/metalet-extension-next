export type utxoInput = {
  txId: string
  vOut: number
  amount: number // min unit: satoshi
  address?: string
  reedScript?: string
  privateKey?: string
  publicKey?: string
  sequence?: number
  nonWitnessUtxo?: string
  bip32Derivation?: Bip32Derivation[]
  derivationPath?: string
  sighashType?: number
  data?: any // xrc20 token info
}

export type Bip32Derivation = {
  masterFingerprint: string
  pubkey: string
  path: string
  leafHashes?: string[]
}

export type utxoOutput = {
  address: string
  amount: number // min unit: satoshi
  omniScript?: string
  bip32Derivation?: Bip32Derivation[]
  derivationPath?: string
  isChange?: boolean
  data?: any // xrc20 token info
}

export type omniOutput = {
  coinType?: number // usdt 31
  amount: number // need to multiply 10^8
}

export type utxoTx = {
  // inputs: []
  // outputs: []
  // address: string   // change address
  // feePerB?: number  //  Sat/b
  // decimal?: number  // precision: 8 bit
  // fee?: number      // fixed fee  eg: 0.001 AVAX
  // omni?: omniOutput
  // dustSize?: number
  // bip32Derivation?: Bip32Derivation[] // derivation info
  // derivationPath?: string
  inputs: []
  outputs: []
  address: string // change address
  feePerB?: number //  Sat/b
  decimal?: number // precision: 8 bit
  fee?: number // fixed fee  eg: 0.001 AVAX
  omni?: omniOutput
  dustSize?: number
  bip32Derivation?: Bip32Derivation[] // derivation info
  derivationPath?: string
  memo?: string
  memoPos?: number
  runeData?: RuneData
}

// rune
export type RuneData = {
  edicts: Edict[]
  etching?: any
  burn?: boolean
}

export type Edict = {
  id: number
  amount: number
  output: number
}

export type ListingData = {
  nftAddress: string
  nftUtxo: {
    txHash: string
    vout: number
    coinAmount: number
    rawTransation: string
  }
  receiveBtcAddress: string
  price: number
}

export type BuyingData = {
  dummyUtxos: {
    txHash: string
    vout: number
    coinAmount: number
    rawTransation: string
  }[]
  paymentUtxos: {
    txHash: string
    vout: number
    coinAmount: number
    rawTransation: string
  }[]
  receiveNftAddress: string
  paymentAndChangeAddress: string
  feeRate: number
  sellerPsbts: string[]
}

export type toSignInputs = {
  index: number
  address: string
  publicKey: string
  sighashTypes: number[]
  disableTweakSigner: boolean
}

export type toSignInput = {
  index: number
  address: string
  publicKey?: string
  sighashTypes?: number[]
  disableTweakSigner?: boolean
}

export type signPsbtOptions = {
  autoFinalized?: boolean
  toSignInputs?: toSignInput[]
}
