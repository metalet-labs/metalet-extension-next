/**
 * 模拟 DOGE 铭刻交易 - 展示 scriptsig-size 问题
 * 
 * 这个脚本模拟创建一个包含图片数据的 DOGE 铭刻交易
 * 展示当数据过大时 ScriptSig 会超出限制
 */

const crypto = require('crypto');

// DOGE 网络常量
const DOGE_SCRIPTSIG_LIMIT = 1650; // Dogecoin 节点的 ScriptSig 大小限制 (大约)
const MAX_CHUNK_LEN = 240;
const MAX_PAYLOAD_LEN = 1500;

// 模拟一个 2KB 的 PNG 图片 base64 数据
function generateMockImageBase64(sizeBytes = 2048) {
  const randomBytes = crypto.randomBytes(sizeBytes);
  return randomBytes.toString('base64');
}

// 构建 push data
function pushData(data) {
  const buf = Buffer.from(data);
  const len = buf.length;
  
  if (len === 0) {
    return Buffer.from([0x00]); // OP_0
  } else if (len < 76) {
    return Buffer.concat([Buffer.from([len]), buf]);
  } else if (len <= 0xff) {
    return Buffer.concat([Buffer.from([0x4c, len]), buf]); // OP_PUSHDATA1
  } else if (len <= 0xffff) {
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16LE(len);
    return Buffer.concat([Buffer.from([0x4d]), lenBuf, buf]); // OP_PUSHDATA2
  } else {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32LE(len);
    return Buffer.concat([Buffer.from([0x4e]), lenBuf, buf]); // OP_PUSHDATA4
  }
}

// 构建 MetaID Inscription 脚本
function buildInscriptionScript(metaidData) {
  const body = Buffer.from(metaidData.body, metaidData.encoding || 'utf8');
  
  // 将 body 分块
  const bodyParts = [];
  for (let i = 0; i < body.length; i += MAX_CHUNK_LEN) {
    bodyParts.push(body.slice(i, Math.min(i + MAX_CHUNK_LEN, body.length)));
  }
  
  if (bodyParts.length === 0) {
    bodyParts.push(Buffer.alloc(0));
  }
  
  const chunks = [];
  
  // 1. metaid 标识
  chunks.push(pushData(Buffer.from('metaid')));
  
  // 2. operation
  chunks.push(pushData(Buffer.from(metaidData.operation)));
  
  // 3. contentType
  chunks.push(pushData(Buffer.from(metaidData.contentType || 'text/plain')));
  
  // 4. encryption
  chunks.push(pushData(Buffer.from(metaidData.encryption || '0')));
  
  // 5. version
  chunks.push(pushData(Buffer.from(metaidData.version || '1.0.0')));
  
  // 6. path
  chunks.push(pushData(Buffer.from(metaidData.path || '')));
  
  // 7. body chunks
  for (const part of bodyParts) {
    chunks.push(pushData(part));
  }
  
  return Buffer.concat(chunks);
}

// 计算 inscription 脚本中的 chunk 数量
function countChunks(inscriptionScript) {
  let count = 0;
  let i = 0;
  
  while (i < inscriptionScript.length) {
    const opcode = inscriptionScript[i];
    
    if (opcode === 0) {
      count++;
      i++;
    } else if (opcode >= 1 && opcode <= 75) {
      count++;
      i += 1 + opcode;
    } else if (opcode === 0x4c) { // OP_PUSHDATA1
      const len = inscriptionScript[i + 1];
      count++;
      i += 2 + len;
    } else if (opcode === 0x4d) { // OP_PUSHDATA2
      const len = inscriptionScript[i + 1] | (inscriptionScript[i + 2] << 8);
      count++;
      i += 3 + len;
    } else if (opcode === 0x4e) { // OP_PUSHDATA4
      const len = inscriptionScript[i + 1] | (inscriptionScript[i + 2] << 8) | 
                  (inscriptionScript[i + 3] << 16) | (inscriptionScript[i + 4] << 24);
      count++;
      i += 5 + len;
    } else {
      i++;
    }
  }
  
  return count;
}

// 构建 Lock Script (Redeem Script)
function buildLockScript(publicKey, inscriptionScript) {
  const chunks = [];
  
  // 1. 公钥
  chunks.push(pushData(publicKey));
  
  // 2. OP_CHECKSIGVERIFY (0xad)
  chunks.push(Buffer.from([0xad]));
  
  // 3. 为每个 inscription chunk 添加 OP_DROP (0x75)
  const dropCount = countChunks(inscriptionScript);
  for (let i = 0; i < dropCount; i++) {
    chunks.push(Buffer.from([0x75]));
  }
  
  // 4. OP_TRUE (0x51)
  chunks.push(Buffer.from([0x51]));
  
  return Buffer.concat(chunks);
}

// 构建 P2SH Unlock Script (ScriptSig)
function buildUnlockScript(inscriptionScript, signature, lockScript) {
  return Buffer.concat([
    inscriptionScript,
    pushData(signature),
    pushData(lockScript)
  ]);
}

// 模拟构建完整的 Reveal 交易
function buildMockRevealTx(unlockScript) {
  const parts = [];
  
  // Version (4 bytes)
  const version = Buffer.alloc(4);
  version.writeUInt32LE(2);
  parts.push(version);
  
  // Input count (1 byte)
  parts.push(Buffer.from([0x01]));
  
  // Input 0: P2SH input
  // Previous txid (32 bytes) - 模拟
  parts.push(crypto.randomBytes(32));
  
  // Previous output index (4 bytes)
  const vout = Buffer.alloc(4);
  vout.writeUInt32LE(0);
  parts.push(vout);
  
  // ScriptSig length (varint)
  const scriptLen = unlockScript.length;
  if (scriptLen < 0xfd) {
    parts.push(Buffer.from([scriptLen]));
  } else if (scriptLen <= 0xffff) {
    parts.push(Buffer.from([0xfd]));
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16LE(scriptLen);
    parts.push(lenBuf);
  } else {
    parts.push(Buffer.from([0xfe]));
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32LE(scriptLen);
    parts.push(lenBuf);
  }
  
  // ScriptSig
  parts.push(unlockScript);
  
  // Sequence (4 bytes)
  parts.push(Buffer.from([0xff, 0xff, 0xff, 0xff]));
  
  // Output count (1 byte)
  parts.push(Buffer.from([0x01]));
  
  // Output 0
  // Value (8 bytes) - 0.01 DOGE = 1000000 satoshis
  const value = Buffer.alloc(8);
  value.writeBigUInt64LE(BigInt(1000000));
  parts.push(value);
  
  // Output script length (1 byte)
  parts.push(Buffer.from([0x19])); // 25 bytes for P2PKH
  
  // P2PKH output script
  parts.push(Buffer.from([0x76, 0xa9, 0x14])); // OP_DUP OP_HASH160 PUSH_20
  parts.push(crypto.randomBytes(20)); // pubkey hash
  parts.push(Buffer.from([0x88, 0xac])); // OP_EQUALVERIFY OP_CHECKSIG
  
  // Locktime (4 bytes)
  parts.push(Buffer.alloc(4));
  
  return Buffer.concat(parts);
}

// ========================================
// 主程序：模拟不同大小的铭刻交易
// ========================================

console.log('='.repeat(80));
console.log('DOGE 铭刻交易模拟 - ScriptSig 大小分析');
console.log('='.repeat(80));

// 模拟公钥 (33 bytes compressed)
const mockPublicKey = Buffer.concat([
  Buffer.from([0x02]),
  crypto.randomBytes(32)
]);

// 模拟签名 (约 71-73 bytes DER)
const mockSignature = Buffer.concat([
  Buffer.from([0x30, 0x45, 0x02, 0x21]),
  crypto.randomBytes(33),
  Buffer.from([0x02, 0x20]),
  crypto.randomBytes(32),
  Buffer.from([0x01]) // SIGHASH_ALL
]);

console.log('\n【基础信息】');
console.log('- 模拟公钥长度:', mockPublicKey.length, 'bytes');
console.log('- 模拟签名长度:', mockSignature.length, 'bytes');
console.log('- DOGE ScriptSig 限制:', DOGE_SCRIPTSIG_LIMIT, 'bytes (约)');

// 测试不同大小的图片
const testSizes = [
  { name: '小 JSON', bytes: 100, type: 'json' },
  { name: '500B 图片', bytes: 500, type: 'image' },
  { name: '1KB 图片', bytes: 1024, type: 'image' },
  { name: '1.5KB 图片', bytes: 1536, type: 'image' },
  { name: '2KB 图片 (用户案例)', bytes: 2048, type: 'image' },
  { name: '3KB 图片', bytes: 3072, type: 'image' },
];

console.log('\n' + '='.repeat(80));
console.log('不同数据大小的 ScriptSig 分析');
console.log('='.repeat(80));

const results = [];

for (const test of testSizes) {
  let body, contentType, encoding;
  
  if (test.type === 'json') {
    body = JSON.stringify({ message: 'Hello MetaID on DOGE!', timestamp: Date.now() });
    contentType = 'application/json';
    encoding = 'utf8';
  } else {
    body = generateMockImageBase64(test.bytes);
    contentType = 'image/png;binary';
    encoding = 'base64';
  }
  
  const metaidData = {
    operation: 'create',
    path: 'show:/file',
    contentType,
    encryption: '0',
    version: '1.0.0',
    body,
    encoding
  };
  
  // 构建脚本
  const inscriptionScript = buildInscriptionScript(metaidData);
  const lockScript = buildLockScript(mockPublicKey, inscriptionScript);
  const unlockScript = buildUnlockScript(inscriptionScript, mockSignature, lockScript);
  
  // 构建交易
  const revealTx = buildMockRevealTx(unlockScript);
  
  const passed = unlockScript.length <= DOGE_SCRIPTSIG_LIMIT;
  
  results.push({
    name: test.name,
    rawBytes: test.bytes,
    bodyBytes: Buffer.from(body, encoding).length,
    inscriptionLen: inscriptionScript.length,
    lockScriptLen: lockScript.length,
    unlockScriptLen: unlockScript.length,
    txLen: revealTx.length,
    passed
  });
  
  console.log(`\n【${test.name}】`);
  console.log(`  原始数据: ${test.bytes} bytes`);
  console.log(`  编码后 body: ${Buffer.from(body, encoding).length} bytes`);
  console.log(`  Inscription 脚本: ${inscriptionScript.length} bytes`);
  console.log(`  Lock Script: ${lockScript.length} bytes`);
  console.log(`  Unlock Script (ScriptSig): ${unlockScript.length} bytes`);
  console.log(`  完整交易: ${revealTx.length} bytes`);
  console.log(`  状态: ${passed ? '✅ 可广播' : '❌ scriptsig-size 错误'}`);
  
  if (!passed) {
    console.log(`  超出限制: ${unlockScript.length - DOGE_SCRIPTSIG_LIMIT} bytes`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('模拟 2KB 图片的交易 Hex (会触发 scriptsig-size 错误)');
console.log('='.repeat(80));

// 生成用户案例的交易 hex
const userCaseBody = generateMockImageBase64(2048);
const userCaseMetaidData = {
  operation: 'create',
  path: 'show:/file',
  contentType: 'image/png;binary',
  encryption: '0',
  version: '1.0.0',
  body: userCaseBody,
  encoding: 'base64'
};

const userInscriptionScript = buildInscriptionScript(userCaseMetaidData);
const userLockScript = buildLockScript(mockPublicKey, userInscriptionScript);
const userUnlockScript = buildUnlockScript(userInscriptionScript, mockSignature, userLockScript);
const userRevealTx = buildMockRevealTx(userUnlockScript);

console.log('\n【Reveal 交易 Raw Hex】');
console.log('(这笔交易广播时会返回 scriptsig-size 错误)\n');
console.log(userRevealTx.toString('hex'));

console.log('\n【交易大小统计】');
console.log(`- 交易总长度: ${userRevealTx.length} bytes`);
console.log(`- ScriptSig 长度: ${userUnlockScript.length} bytes`);
console.log(`- 超出限制: ${userUnlockScript.length - DOGE_SCRIPTSIG_LIMIT} bytes`);

console.log('\n' + '='.repeat(80));
console.log('结论');
console.log('='.repeat(80));
console.log(`
DOGE 链铭刻限制:
1. ScriptSig 最大约 ${DOGE_SCRIPTSIG_LIMIT} bytes
2. 实际可用于数据的空间约 ${DOGE_SCRIPTSIG_LIMIT - 200} bytes (扣除签名、公钥、脚本开销)
3. 原始图片最大约 800-1000 bytes
4. base64 编码后最大约 1100-1400 bytes

您的 2KB 图片案例:
- 原始图片: 2048 bytes
- base64 编码后: ~2730 bytes  
- ScriptSig 总大小: ${userUnlockScript.length} bytes
- 超出限制: ${userUnlockScript.length - DOGE_SCRIPTSIG_LIMIT} bytes

这就是为什么广播时会返回 "scriptsig-size" 错误。
`);

// 导出交易 hex 供外部使用
module.exports = {
  revealTxHex: userRevealTx.toString('hex'),
  scriptSigLength: userUnlockScript.length,
  limit: DOGE_SCRIPTSIG_LIMIT
};
