const crypto = require('crypto')

const txHex = '02000000018a813afcba19c1e891aa9d54b8434373c8b7f268221403f3c72d80a7d2a8993a010000006b483045022100a0755e124823a99b30526f2405944a1997e7bbef0aae16ec4997814d82793369022044382b86cdec38af538dd0c0cc288bb30a2d39ff6e1dc0dd26299c9ec966b293012103d47c1f8b94e731aed60e5d2e96e5eab4633f377bb21dbf2a26173cde1cf6a92affffffff02a08601000000000017a914e63dc813741aa430ec198ae19935d3854c6204e28708ee961c000000001976a91474e17316cc147c58424289edca83cc6b851d7d1488ac00000000'

const buf = Buffer.from(txHex, 'hex')

// 提取公钥和地址信息
const pubkey = Buffer.from('03d47c1f8b94e731aed60e5d2e96e5eab4633f377bb21dbf2a26173cde1cf6a92a', 'hex')

// 计算公钥哈希
function hash160(data) {
  const sha256 = crypto.createHash('sha256').update(data).digest()
  return crypto.createHash('ripemd160').update(sha256).digest()
}

const pubkeyHash = hash160(pubkey)
console.log('Public Key:', pubkey.toString('hex'))
console.log('PubKey Hash:', pubkeyHash.toString('hex'))

// 从前序交易获取的输出脚本
const prevOutputScript = '76a91474e17316cc147c58424289edca83cc6b851d7d1488ac'
const scriptPubkeyHash = prevOutputScript.slice(6, 46)
console.log('\nPrev Output Script PubKey Hash:', scriptPubkeyHash)

// 验证公钥哈希是否匹配
const match = pubkeyHash.toString('hex') === scriptPubkeyHash
console.log('\n=== Verification ===')
console.log('PubKey Hash matches prev output:', match ? '✅ YES' : '❌ NO - THIS IS THE PROBLEM!')

if (!match) {
  console.log('\n⚠️  The public key in the signature does not match the UTXO!')
  console.log('Expected PubKey Hash:', scriptPubkeyHash)
  console.log('Actual PubKey Hash:', pubkeyHash.toString('hex'))
}

// 检查 P2SH 输出地址
const p2shHash = 'e63dc813741aa430ec198ae19935d3854c6204e2'
console.log('\n=== P2SH Output ===')
console.log('P2SH Script Hash:', p2shHash)

// 尝试广播
console.log('\n=== Broadcast Test ===')
console.log('Transaction appears structurally valid.')
console.log('If broadcast fails, possible reasons:')
console.log('1. UTXO already spent (double spend)')
console.log('2. Node connectivity issues')
console.log('3. Network congestion')
