/**
 * 测试 Teleport 交易生成
 * 
 * 模拟 BTC -> DOGE 转移 100 个 MRC-20 Token
 * MRC20 ID: 2a69cbf5283f771bf38d525f85a32eb454d308ebeb6279c5afb445dae1387f72i0
 * 
 * 正确的 Teleport 流程：
 * 1. 先在目标链（DOGE）创建 Arrival 交易
 * 2. 再在源链（BTC）创建 Transfer 交易（使用 Arrival 的 txid 作为 coord）
 */

const bitcoin = require('bitcoinjs-lib')
const { payments, networks, script: bscript } = bitcoin
const ecc = require('@bitcoinerlab/secp256k1')
const ECPairFactory = require('ecpair').default

bitcoin.initEccLib(ecc)
const ECPair = ECPairFactory(ecc)

// DOGE 主网配置
const dogeMainnet = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bech32: 'doge',
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398,
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e,
}

// 生成测试密钥对（使用固定种子以便复现）
const privateKeyBTC = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
const privateKeyDOGE = Buffer.from('0000000000000000000000000000000000000000000000000000000000000002', 'hex')

const testKeyPairBTC = ECPair.fromPrivateKey(privateKeyBTC, { network: networks.bitcoin })
const testKeyPairDOGE = ECPair.fromPrivateKey(privateKeyDOGE, { network: dogeMainnet })

// MRC20 信息
const MRC20_ID = '2a69cbf5283f771bf38d525f85a32eb454d308ebeb6279c5afb445dae1387f72i0'
const TRANSFER_AMOUNT = '100'

// 模拟 MRC-20 资产所在的 UTXO（从 API 获取）
// API: /mrc20/address/utxo?address=xxx&tickId=xxx
// 返回的 mrc20s[0].txPoint = "ca5f09e8953dc484a6750ed4f24d2be3a5240e1026a3c000787a400b98ecbffc:1"
// assetOutpoint 直接使用 txPoint 格式 (txid:vout)
const ASSET_OUTPOINT = 'ca5f09e8953dc484a6750ed4f24d2be3a5240e1026a3c000787a400b98ecbffc:1'

// 模拟 UTXO（真实场景需要从链上获取）
const MOCK_BTC_UTXO = {
  txId: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  outputIndex: 0,
  satoshis: 50000, // 0.0005 BTC
}

const MOCK_DOGE_UTXO = {
  txId: 'b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1',
  outputIndex: 0,
  satoshis: 500000000, // 5 DOGE
}

// ==================== 1. DOGE Arrival 交易（先执行）====================
function createDOGEArrivalTx() {
  console.log('\n' + '='.repeat(70))
  console.log('步骤 1: DOGE Arrival Transaction (目标链)')
  console.log('='.repeat(70) + '\n')
  
  const network = dogeMainnet
  const keyPair = testKeyPairDOGE
  const { address, output: p2pkhOutput } = payments.p2pkh({ pubkey: keyPair.publicKey, network })
  
  console.log('DOGE Address:', address)
  console.log('DOGE Public Key:', keyPair.publicKey.toString('hex'))
  
  // Arrival Pin 数据
  // assetOutpoint 来自 API 返回的 mrc20s[x].txPoint
  const arrivalData = {
    assetOutpoint: ASSET_OUTPOINT, // MRC-20 资产当前所在的 UTXO
    amount: TRANSFER_AMOUNT,
    tickId: MRC20_ID,
    locationIndex: 0,
    metadata: ''
  }
  
  console.log('\nArrival Pin Data:')
  console.log(JSON.stringify(arrivalData, null, 2))
  console.log('\nassetOutpoint 来源:')
  console.log('  API: /mrc20/address/utxo?address=xxx&tickId=xxx')
  console.log('  返回: mrc20s[0].txPoint =', ASSET_OUTPOINT)
  console.log('  直接使用 txid:vout 格式')
  
  // 构建 MetaID inscription 数据
  const metaidContent = Buffer.concat([
    Buffer.from('metaid', 'utf8'),
    Buffer.from([0x00]),
    Buffer.from('create', 'utf8'),
    Buffer.from([0x00]),
    Buffer.from('/ft/mrc20/arrival', 'utf8'),
    Buffer.from([0x00]),
    Buffer.from('0', 'utf8'),
    Buffer.from([0x00]),
    Buffer.from('1.0.0', 'utf8'),
    Buffer.from([0x00]),
    Buffer.from('application/json', 'utf8'),
    Buffer.from([0x00]),
    Buffer.from(JSON.stringify(arrivalData), 'utf8')
  ])
  
  console.log('\nMetaID Content (hex):', metaidContent.toString('hex'))
  console.log('MetaID Content Length:', metaidContent.length, 'bytes')
  
  // 构建交易
  const tx = new bitcoin.Transaction()
  tx.version = 2
  
  // 添加输入
  tx.addInput(Buffer.from(MOCK_DOGE_UTXO.txId, 'hex').reverse(), MOCK_DOGE_UTXO.outputIndex)
  
  // 输出 0: Pin 输出 (100000 satoshis = 0.001 DOGE)
  tx.addOutput(p2pkhOutput, 100000)
  
  // 输出 1: OP_RETURN (MetaID inscription)
  const opReturnScript = bscript.compile([
    bitcoin.opcodes.OP_RETURN,
    metaidContent
  ])
  tx.addOutput(opReturnScript, 0)
  
  // 输出 2: 找零
  const fee = 1000000 // 0.01 DOGE 手续费
  const changeAmount = MOCK_DOGE_UTXO.satoshis - 100000 - fee
  tx.addOutput(p2pkhOutput, changeAmount)
  
  // 签名
  const signatureHash = tx.hashForSignature(0, p2pkhOutput, bitcoin.Transaction.SIGHASH_ALL)
  const signature = keyPair.sign(signatureHash)
  const signatureWithHashType = Buffer.concat([
    signature,
    Buffer.from([bitcoin.Transaction.SIGHASH_ALL])
  ])
  
  tx.setInputScript(0, bscript.compile([
    signatureWithHashType,
    keyPair.publicKey
  ]))
  
  const txHex = tx.toHex()
  const txId = tx.getId()
  
  console.log('\n--- DOGE Arrival Transaction Details ---')
  console.log('TxID:', txId)
  console.log('TxHex Length:', txHex.length / 2, 'bytes')
  console.log('\nTransaction Structure:')
  console.log('  Version:', tx.version)
  console.log('  Inputs:', tx.ins.length)
  console.log('    [0] Previous TxID:', MOCK_DOGE_UTXO.txId)
  console.log('        Previous Vout:', MOCK_DOGE_UTXO.outputIndex)
  console.log('  Outputs:', tx.outs.length)
  console.log('    [0] Pin Output:', 100000, 'satoshis (0.001 DOGE)')
  console.log('    [1] OP_RETURN: MetaID inscription')
  console.log('    [2] Change:', changeAmount, 'satoshis')
  
  return { txId, txHex, arrivalData }
}

// ==================== 2. BTC Transfer 交易（后执行）====================
function createBTCTransferTx(dogeArrivalTxId) {
  console.log('\n' + '='.repeat(70))
  console.log('步骤 2: BTC Transfer Transaction (源链)')
  console.log('='.repeat(70) + '\n')
  
  const network = networks.bitcoin
  const keyPair = testKeyPairBTC
  const { address, output: p2pkhOutput } = payments.p2pkh({ pubkey: keyPair.publicKey, network })
  
  console.log('BTC Address:', address)
  console.log('BTC Public Key:', keyPair.publicKey.toString('hex'))
  
  // coord 使用 DOGE Arrival 交易的 outpoint
  const coord = `${dogeArrivalTxId}i0`
  
  // Transfer Pin 数据
  const transferData = {
    id: MRC20_ID,
    amount: TRANSFER_AMOUNT,
    coord: coord, // 指向 DOGE 链上的 Arrival 交易
    chain: 'dogecoin',
    type: 'teleport'
  }
  
  console.log('\nTransfer Pin Data:')
  console.log(JSON.stringify(transferData, null, 2))
  console.log('\ncoord 解释: 指向 DOGE 链上 Arrival 交易的第 0 个输出')
  
  // 构建 MetaID inscription 数据
  const metaidContent = Buffer.concat([
    Buffer.from('metaid', 'utf8'),
    Buffer.from([0x00]),
    Buffer.from('create', 'utf8'),
    Buffer.from([0x00]),
    Buffer.from('/ft/mrc20/transfer', 'utf8'),
    Buffer.from([0x00]),
    Buffer.from('0', 'utf8'),
    Buffer.from([0x00]),
    Buffer.from('1.0.0', 'utf8'),
    Buffer.from([0x00]),
    Buffer.from('application/json', 'utf8'),
    Buffer.from([0x00]),
    Buffer.from(JSON.stringify(transferData), 'utf8')
  ])
  
  console.log('\nMetaID Content (hex):', metaidContent.toString('hex'))
  console.log('MetaID Content Length:', metaidContent.length, 'bytes')
  
  // 构建交易
  const tx = new bitcoin.Transaction()
  tx.version = 2
  
  // 添加输入
  tx.addInput(Buffer.from(MOCK_BTC_UTXO.txId, 'hex').reverse(), MOCK_BTC_UTXO.outputIndex)
  
  // 输出 0: Pin 输出 (546 satoshis - dust limit)
  tx.addOutput(p2pkhOutput, 546)
  
  // 输出 1: OP_RETURN (MetaID inscription)
  const opReturnScript = bscript.compile([
    bitcoin.opcodes.OP_RETURN,
    metaidContent
  ])
  tx.addOutput(opReturnScript, 0)
  
  // 输出 2: 找零
  const fee = 2000 // 2000 satoshis 手续费
  const changeAmount = MOCK_BTC_UTXO.satoshis - 546 - fee
  tx.addOutput(p2pkhOutput, changeAmount)
  
  // 签名
  const signatureHash = tx.hashForSignature(0, p2pkhOutput, bitcoin.Transaction.SIGHASH_ALL)
  const signature = keyPair.sign(signatureHash)
  const signatureWithHashType = Buffer.concat([
    signature,
    Buffer.from([bitcoin.Transaction.SIGHASH_ALL])
  ])
  
  tx.setInputScript(0, bscript.compile([
    signatureWithHashType,
    keyPair.publicKey
  ]))
  
  const txHex = tx.toHex()
  const txId = tx.getId()
  
  console.log('\n--- BTC Transfer Transaction Details ---')
  console.log('TxID:', txId)
  console.log('TxHex Length:', txHex.length / 2, 'bytes')
  console.log('\nTransaction Structure:')
  console.log('  Version:', tx.version)
  console.log('  Inputs:', tx.ins.length)
  console.log('    [0] Previous TxID:', MOCK_BTC_UTXO.txId)
  console.log('        Previous Vout:', MOCK_BTC_UTXO.outputIndex)
  console.log('  Outputs:', tx.outs.length)
  console.log('    [0] Pin Output:', 546, 'satoshis')
  console.log('    [1] OP_RETURN: MetaID inscription')
  console.log('    [2] Change:', changeAmount, 'satoshis')
  
  return { txId, txHex, transferData, coord }
}

// ==================== 主函数 ====================
function main() {
  console.log('\n' + '='.repeat(70))
  console.log('Teleport MRC-20 交易模拟')
  console.log('='.repeat(70))
  console.log('\nMRC-20 Token ID:', MRC20_ID)
  console.log('Transfer Amount:', TRANSFER_AMOUNT)
  console.log('From Chain: BTC (Bitcoin)')
  console.log('To Chain: DOGE (Dogecoin)')
  console.log('\n流程说明:')
  console.log('  1. 先在目标链 (DOGE) 创建 Arrival 交易')
  console.log('  2. 再在源链 (BTC) 创建 Transfer 交易，coord 指向 Arrival')
  
  try {
    // 步骤 1: 创建 DOGE Arrival 交易
    const dogeResult = createDOGEArrivalTx()
    
    // 步骤 2: 创建 BTC Transfer 交易（使用 DOGE Arrival 的 txId 作为 coord）
    const btcResult = createBTCTransferTx(dogeResult.txId)
    
    // 输出完整结果
    console.log('\n' + '='.repeat(70))
    console.log('完整交易数据')
    console.log('='.repeat(70))
    
    console.log('\n========== 1. DOGE Arrival Transaction ==========')
    console.log('Path: /ft/mrc20/arrival')
    console.log('TxID:', dogeResult.txId)
    console.log('Purpose: 在目标链上声明接收资产的位置')
    console.log('\nPin Data:')
    console.log(JSON.stringify(dogeResult.arrivalData, null, 2))
    console.log('\nTxHex:')
    console.log(dogeResult.txHex)
    
    console.log('\n========== 2. BTC Transfer Transaction ==========')
    console.log('Path: /ft/mrc20/transfer')
    console.log('TxID:', btcResult.txId)
    console.log('Coord:', btcResult.coord)
    console.log('Purpose: 在源链上发起资产转移，指向目标链的 Arrival')
    console.log('\nPin Data:')
    console.log(JSON.stringify(btcResult.transferData, null, 2))
    console.log('\nTxHex:')
    console.log(btcResult.txHex)
    
    console.log('\n' + '='.repeat(70))
    console.log('交易关系说明')
    console.log('='.repeat(70))
    console.log(`
BTC Transfer 交易中的 coord 字段:
  "${btcResult.coord}"
  
这个 coord 指向 DOGE Arrival 交易的输出:
  - txid: ${dogeResult.txId}
  - vout: 0 (Pin 输出)

这样就建立了跨链的资产转移关系:
  BTC 链上的 MRC-20 Token → DOGE 链上的接收位置
`)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
