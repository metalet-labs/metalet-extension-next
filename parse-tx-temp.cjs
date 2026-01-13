const txHex = '02000000018a813afcba19c1e891aa9d54b8434373c8b7f268221403f3c72d80a7d2a8993a010000006b483045022100a0755e124823a99b30526f2405944a1997e7bbef0aae16ec4997814d82793369022044382b86cdec38af538dd0c0cc288bb30a2d39ff6e1dc0dd26299c9ec966b293012103d47c1f8b94e731aed60e5d2e96e5eab4633f377bb21dbf2a26173cde1cf6a92affffffff02a08601000000000017a914e63dc813741aa430ec198ae19935d3854c6204e28708ee961c000000001976a91474e17316cc147c58424289edca83cc6b851d7d1488ac00000000'

const buf = Buffer.from(txHex, 'hex')
let offset = 0

console.log('=== DOGE Transaction Analysis ===')
console.log('Raw Hex Length:', txHex.length / 2, 'bytes')
console.log('')

// Version
const version = buf.readUInt32LE(offset); offset += 4
console.log('Version:', version)

// Input count
const inputCount = buf[offset++]
console.log('Input Count:', inputCount)

let totalInputValue = 0 // 需要从区块链获取

for (let i = 0; i < inputCount; i++) {
  console.log(`\n--- Input ${i} ---`)
  const prevTxId = buf.slice(offset, offset + 32).reverse().toString('hex'); offset += 32
  const vout = buf.readUInt32LE(offset); offset += 4
  console.log('Prev TxId:', prevTxId)
  console.log('Vout:', vout)
  
  // ScriptSig length
  let scriptLen = buf[offset++]
  if (scriptLen === 0xfd) {
    scriptLen = buf.readUInt16LE(offset); offset += 2
  }
  console.log('ScriptSig Length:', scriptLen)
  
  const scriptSig = buf.slice(offset, offset + scriptLen); offset += scriptLen
  console.log('ScriptSig:', scriptSig.toString('hex'))
  
  // 检查签名格式
  if (scriptSig[0] === 0x48 || scriptSig[0] === 0x47 || scriptSig[0] === 0x46) {
    const sigLen = scriptSig[0]
    const sig = scriptSig.slice(1, 1 + sigLen)
    console.log('Signature Length:', sigLen, 'bytes')
    console.log('Signature (DER):', sig.toString('hex').slice(0, 60) + '...')
    
    // 检查 SIGHASH 类型
    const sighashType = sig[sig.length - 1]
    console.log('SIGHASH Type:', sighashType === 1 ? 'SIGHASH_ALL (0x01)' : `0x${sighashType.toString(16)}`)
    
    // 公钥
    const pubkeyStart = 1 + sigLen
    if (scriptSig[pubkeyStart] === 0x21) {
      const pubkey = scriptSig.slice(pubkeyStart + 1, pubkeyStart + 1 + 33)
      console.log('Public Key (compressed):', pubkey.toString('hex'))
    }
  }
  
  const sequence = buf.readUInt32LE(offset); offset += 4
  console.log('Sequence:', '0x' + sequence.toString(16))
}

// Output count
const outputCount = buf[offset++]
console.log('\n=== Outputs ===')
console.log('Output Count:', outputCount)

let totalOutputValue = 0

for (let i = 0; i < outputCount; i++) {
  const value = Number(buf.readBigUInt64LE(offset)); offset += 8
  const scriptLen = buf[offset++]
  const script = buf.slice(offset, offset + scriptLen); offset += scriptLen
  totalOutputValue += value
  
  console.log(`\nOutput ${i}:`)
  console.log('  Value:', value, 'satoshis =', (value / 100000000).toFixed(8), 'DOGE')
  console.log('  Script:', script.toString('hex'))
  
  // 解析输出脚本类型
  if (script[0] === 0xa9 && script[1] === 0x14 && script[script.length - 1] === 0x87) {
    console.log('  Type: P2SH (Pay-to-Script-Hash)')
    console.log('  Script Hash:', script.slice(2, 22).toString('hex'))
  } else if (script[0] === 0x76 && script[1] === 0xa9) {
    console.log('  Type: P2PKH (Pay-to-Public-Key-Hash)')
    console.log('  PubKey Hash:', script.slice(3, 23).toString('hex'))
  }
}

const locktime = buf.readUInt32LE(offset)
console.log('\nLocktime:', locktime)

console.log('\n=== Fee Analysis ===')
console.log('Total Output Value:', totalOutputValue, 'satoshis =', (totalOutputValue / 1e8).toFixed(8), 'DOGE')
console.log('Transaction Size:', txHex.length / 2, 'bytes')

// 估算输入值 (假设是 commit 交易)
// P2SH 输出是 100000 satoshis，找零需要更多
console.log('\nNote: To calculate fee, we need the input UTXO value.')
console.log('Input TxId to lookup:', buf.slice(4, 36).reverse().toString('hex'))

// 检查是否有问题
console.log('\n=== Potential Issues ===')

// 1. 检查交易大小
const txSize = txHex.length / 2
console.log('1. Transaction Size:', txSize, 'bytes -', txSize < 100 ? 'WARNING: Too small!' : 'OK')

// 2. 检查输出值
const p2shOutput = 100000
const changeOutput = totalOutputValue - p2shOutput
console.log('2. P2SH Output:', p2shOutput / 1e8, 'DOGE -', p2shOutput >= 100000 ? 'OK' : 'WARNING: Below dust limit')
console.log('3. Change Output:', changeOutput / 1e8, 'DOGE')

// 3. 估算需要的费用
const estimatedFeeRate = 300000 // 300000 sat/KB
const estimatedFee = Math.ceil((txSize * estimatedFeeRate) / 1000)
console.log('4. Estimated Fee at 300000 sat/KB:', estimatedFee, 'satoshis =', (estimatedFee / 1e8).toFixed(8), 'DOGE')

// 4. 如果知道输入值，可以计算实际费用
console.log('\n=== To Calculate Actual Fee ===')
console.log('Need to query input UTXO value from blockchain explorer')
console.log('Fee = Input Value - Total Output Value')
