const commitHex = '0200000001e30c0a9f34e16d593c1392dd89461eb453c4bb745fd9cc0f9bcb8078b9e13c57010000006a47304402202c3465fcd4bbaf491779ccb53c9bd76d1bb547cfbccde078f209436f6265559f02207ba41c3df5daa9bb878e90874723696564dfb8e6e36d77d2aaa5530b3bfaeb43012103060cec807128de5e24955a1c73f54294501f2db56d996c68ab538191686c4be1ffffffff02a08601000000000017a914cf45c4b29e21f5b2079569e0547d7241ef5f070f87a405a42f000000001976a914823a62f0c10306412cbe50d1697d097f889c57d788ac00000000'

const revealHex = '02000000021eb2ebb64800b5e187b9a486b53cdeedf5dfee5b198c4aa611b6df1b92293f0400000000be066d6574616964066372656174650a746578742f706c61696e013005312e302e30152f70726f746f636f6c732f73696d706c6562757a7a1248656c6c6f20444f4745204d65746149442147304402204c70316274cc43c4d52f4d91974508475e3518c66e15eaf2f2fd4464dd68cea102202b8520044e69306dadc83358124d5c959db3827a201fc9fab1ac6cb622c1bc73012b210391af3efa5677c449c061b8e43448b8a7f993a76d7330de77a7a3c1fd700527cdad7575757575757551ffffffff1eb2ebb64800b5e187b9a486b53cdeedf5dfee5b198c4aa611b6df1b92293f04010000006b4830450221008a71f21b93f404a063fa8a5001316cf6f14c1fb33984ed9555f9915e22663f5a02206290a9d5502846aa452b9e3c3256ff8db89c0275f2dce4e17b7138d38c4e4013012103060cec807128de5e24955a1c73f54294501f2db56d996c68ab538191686c4be1ffffffff02a0860100000000001976a914823a62f0c10306412cbe50d1697d097f889c57d788ac9473a02f000000001976a914823a62f0c10306412cbe50d1697d097f889c57d788ac00000000'

const crypto = require('crypto')

function hash160(data) {
  const sha256 = crypto.createHash('sha256').update(data).digest()
  const ripemd160 = crypto.createHash('ripemd160').update(sha256).digest()
  return ripemd160
}

// 检查 P2SH 输出脚本
const p2shScript = 'a914cf45c4b29e21f5b2079569e0547d7241ef5f070f87'
console.log('=== P2SH 输出分析 ===')
console.log('P2SH Script:', p2shScript)
console.log('  Hash160:', p2shScript.slice(4, 44))

// 从 reveal 交易中提取 ScriptSig
const revealBuf = Buffer.from(revealHex, 'hex')
// offset: version(4) + inputCount(1) + prevTxId(32) + vout(4) = 41
// 然后是 scriptLen (1 byte = 0xbe = 190)
const scriptSigStart = 42
const scriptSigLen = 190
const scriptSig = revealBuf.slice(scriptSigStart, scriptSigStart + scriptSigLen)

console.log('')
console.log('=== Reveal ScriptSig 分析 ===')
console.log('ScriptSig 长度:', scriptSig.length, 'bytes')
console.log('ScriptSig Hex:', scriptSig.toString('hex'))

// 解析 ScriptSig 中的每个 push data
let idx = 0
const chunks = []
while (idx < scriptSig.length) {
  const opcode = scriptSig[idx]
  if (opcode >= 1 && opcode <= 75) {
    const data = scriptSig.slice(idx + 1, idx + 1 + opcode)
    chunks.push({ len: opcode, data, hex: data.toString('hex') })
    idx += 1 + opcode
  } else {
    break
  }
}

console.log('')
console.log('Chunks count:', chunks.length)
for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i]
  const isText = c.data.every(b => b >= 32 && b < 127) && c.len < 50
  if (isText) {
    console.log(i + 1 + '. [' + c.len + ' bytes] "' + c.data.toString('utf8') + '"')
  } else {
    console.log(i + 1 + '. [' + c.len + ' bytes] ' + c.hex.slice(0, 40) + '...')
  }
}

// Redeem Script 是最后一个 chunk
const redeemScript = chunks[chunks.length - 1].data
console.log('')
console.log('=== Redeem Script ===')
console.log('Redeem Script:', redeemScript.toString('hex'))
console.log('Redeem Script 长度:', redeemScript.length, 'bytes')

// 计算 hash160
const redeemHash = hash160(redeemScript)
console.log('')
console.log('=== Hash160 验证 ===')
console.log('Redeem Script Hash160:', redeemHash.toString('hex'))
console.log('P2SH 中的 Hash160:    ', p2shScript.slice(4, 44))
const match = redeemHash.toString('hex') === p2shScript.slice(4, 44)
console.log('匹配:', match ? '✓ 是' : '✗ 否 - 这是问题所在!')

if (!match) {
  console.log('')
  console.log('=== 问题分析 ===')
  console.log('P2SH 输出中的 hash160 和 reveal 中的 redeem script hash160 不匹配')
  console.log('这意味着:')
  console.log('1. commit 交易在构建 P2SH 时使用了不同的 inscription data')
  console.log('2. 或者 reveal 交易的 redeem script 构建方式不正确')
  
  // 让我们验证 redeem script 的结构
  console.log('')
  console.log('=== Redeem Script 结构 ===')
  let rIdx = 0
  if (redeemScript[rIdx] === 0x21) {
    console.log('PUSH 33 bytes (pubkey):', redeemScript.slice(rIdx + 1, rIdx + 34).toString('hex'))
    rIdx += 34
  }
  while (rIdx < redeemScript.length) {
    const op = redeemScript[rIdx]
    if (op === 0xad) console.log('OP_CHECKSIGVERIFY')
    else if (op === 0x75) console.log('OP_DROP')
    else if (op === 0x51) console.log('OP_TRUE')
    else console.log('0x' + op.toString(16))
    rIdx++
  }
}
