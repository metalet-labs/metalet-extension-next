const bitcoin = require('bitcoinjs-lib');

// 手动构建一个只有 outputs 的交易
// 这里直接使用 P2PKH output script

// P2PKH output script 格式:
// OP_DUP OP_HASH160 <20-byte-pubkey-hash> OP_EQUALVERIFY OP_CHECKSIG
// 76 a9 14 <20-bytes> 88 ac

// 创建一个只有 outputs 的交易
const tx = new bitcoin.Transaction();
tx.version = 2;

// 示例 pubkey hash (20 bytes) - 这是模拟的
const pubkeyHash1 = Buffer.from('2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b', 'hex');
const pubkeyHash2 = Buffer.from('1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c', 'hex');

// 构建 P2PKH output script
const output1Script = Buffer.concat([
  Buffer.from([0x76, 0xa9, 0x14]), // OP_DUP OP_HASH160 PUSH20
  pubkeyHash1,
  Buffer.from([0x88, 0xac]) // OP_EQUALVERIFY OP_CHECKSIG
]);

const output2Script = Buffer.concat([
  Buffer.from([0x76, 0xa9, 0x14]),
  pubkeyHash2,
  Buffer.from([0x88, 0xac])
]);

// 添加两个 output
// Output 1: 0.5 DOGE = 50,000,000 satoshis
tx.addOutput(output1Script, 50000000);

// Output 2: 0.3 DOGE = 30,000,000 satoshis
tx.addOutput(output2Script, 30000000);

const txHex = tx.toHex();

console.log('=== DogeCompleteTx 测试参数 ===\n');
console.log('txHex:', txHex);
console.log('\nfeeRate: 200000 (sat/KB, 约 0.002 DOGE/KB)\n');
console.log('完整参数对象:');
console.log(JSON.stringify({
  txHex: txHex,
  feeRate: 200000,
  options: {
    noBroadcast: true  // 调试时设为 true，不实际广播
  }
}, null, 2));
