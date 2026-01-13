const txHex = '02000000026fdb502052d93d310a4ceee9a3d0bef73700909d96fb8df4b80f89e76b1e8a0800000000fded01066d657461696406637265617465106170706c69636174696f6e2f6a736f6e013005312e302e304c596263317032306b33783263346d676c6678723577613573677467656368777374706c6438306b727532636734676d6d3475727675617171737661707875303a2f70726f746f636f6c732f73696d706c6567726f7570636861744cf07b2267726f75704944223a22313835376665393832356433316237363939376464633165633737633266393662623137353235643862353961376235353266643337303031363466626635636930222c2274696d657374616d70223a313736363932333437382c226e69636b4e616d65223a224f6365616e5f32222c22636f6e74656e74223a223963316366316134333436326635353662316139373861333037396364306132222c22636f6e74656e7454797065223a22746578742f706c61696e222c22656e6372797074696f6e223a22616573222c227265706c7950696e223a22222c226d656e74696f6e223a5b025d7d483045022100a66e97a1b63446c356fb4d34441f821725f2827e8d10282f6f59ee75f0c5238902205389653b208388357f92ac0d6078141f457760aa401ddaf1a98544c5df88d3e7012c210209016db7843dd878310a5d90de67fb0cd1d8bda8341ace10530b60277f4f8191ad757575757575757551ffffffff6fdb502052d93d310a4ceee9a3d0bef73700909d96fb8df4b80f89e76b1e8a08010000006a47304402205130a0fb69f7dd4bf538a227cbd949080100a4fa41a8ad1476cf0155c01ffbca022041ea6c7507ade4e8dff3cde5cc402bd3e993d727b02b0e93aaea1c37f67905a4012103d47c1f8b94e731aed60e5d2e96e5eab4633f377bb21dbf2a26173cde1cf6a92affffffff02a0860100000000001976a91474e17316cc147c58424289edca83cc6b851d7d1488ace0e99b1c000000001976a91474e17316cc147c58424289edca83cc6b851d7d1488ac00000000';

const buf = Buffer.from(txHex, 'hex');
let offset = 0;

// Version
const version = buf.readUInt32LE(offset);
offset += 4;
console.log('=== 交易基本信息 ===');
console.log('Version:', version);

// Input count
const inputCount = buf[offset];
offset += 1;
console.log('Input Count:', inputCount);

console.log('');
console.log('=== 输入解析 ===');

for (let i = 0; i < inputCount; i++) {
  console.log(`\n--- Input ${i} ---`);
  
  // Previous tx hash (reversed)
  const prevTxHash = buf.slice(offset, offset + 32).reverse().toString('hex');
  offset += 32;
  console.log('Prev TxId:', prevTxHash);
  
  // Previous output index
  const prevIndex = buf.readUInt32LE(offset);
  offset += 4;
  console.log('Prev Index:', prevIndex);
  
  // Script length (varint)
  let scriptLen = buf[offset];
  offset += 1;
  if (scriptLen === 0xfd) {
    scriptLen = buf.readUInt16LE(offset);
    offset += 2;
  }
  console.log('ScriptSig Length:', scriptLen, 'bytes');
  
  // ScriptSig
  const scriptSig = buf.slice(offset, offset + scriptLen);
  offset += scriptLen;
  
  // 解析 ScriptSig 中的数据
  console.log('');
  console.log('ScriptSig 解析:');
  
  let sIdx = 0;
  let chunkNum = 0;
  while (sIdx < scriptSig.length) {
    const opcode = scriptSig[sIdx];
    chunkNum++;
    
    if (opcode >= 1 && opcode <= 75) {
      const data = scriptSig.slice(sIdx + 1, sIdx + 1 + opcode);
      // 尝试解析为文本
      const isText = data.every(b => b >= 32 && b < 127);
      if (isText && opcode < 50) {
        console.log(`  [${chunkNum}] PUSH_${opcode}: "${data.toString('utf8')}"`);
      } else if (opcode === 33 && (data[0] === 0x02 || data[0] === 0x03)) {
        console.log(`  [${chunkNum}] PUSH_33 (公钥): ${data.toString('hex')}`);
      } else if (opcode >= 71 && opcode <= 73) {
        console.log(`  [${chunkNum}] PUSH_${opcode} (签名): ${data.toString('hex').slice(0, 40)}...`);
      } else if (opcode === 44) {
        // Redeem script
        console.log(`  [${chunkNum}] PUSH_${opcode} (Redeem Script): ${data.toString('hex')}`);
        // 解析 redeem script 内部
        console.log('      Redeem Script 解析:');
        let rIdx = 0;
        while (rIdx < data.length) {
          const rop = data[rIdx];
          if (rop === 0x21) {
            console.log('        PUSH_33 (公钥):', data.slice(rIdx + 1, rIdx + 34).toString('hex'));
            rIdx += 34;
          } else if (rop === 0xad) {
            console.log('        OP_CHECKSIGVERIFY');
            rIdx++;
          } else if (rop === 0x75) {
            console.log('        OP_DROP');
            rIdx++;
          } else if (rop === 0x51) {
            console.log('        OP_TRUE');
            rIdx++;
          } else {
            console.log('        OP_0x' + rop.toString(16));
            rIdx++;
          }
        }
      } else {
        // 尝试 JSON
        try {
          const txt = data.toString('utf8');
          if (txt.startsWith('{')) {
            console.log(`  [${chunkNum}] PUSH_${opcode} (JSON): ${txt}`);
          } else {
            console.log(`  [${chunkNum}] PUSH_${opcode}: "${txt}"`);
          }
        } catch {
          console.log(`  [${chunkNum}] PUSH_${opcode}: ${data.toString('hex').slice(0, 60)}...`);
        }
      }
      sIdx += 1 + opcode;
    } else if (opcode === 0x4c) { // OP_PUSHDATA1
      const len = scriptSig[sIdx + 1];
      const data = scriptSig.slice(sIdx + 2, sIdx + 2 + len);
      try {
        const txt = data.toString('utf8');
        if (txt.startsWith('{')) {
          console.log(`  [${chunkNum}] OP_PUSHDATA1(${len}) (JSON):`);
          console.log(`      ${txt}`);
        } else {
          console.log(`  [${chunkNum}] OP_PUSHDATA1(${len}): "${txt}"`);
        }
      } catch {
        console.log(`  [${chunkNum}] OP_PUSHDATA1(${len}): ${data.toString('hex').slice(0, 60)}...`);
      }
      sIdx += 2 + len;
    } else if (opcode === 0xad) {
      console.log(`  [${chunkNum}] OP_CHECKSIGVERIFY`);
      sIdx++;
    } else if (opcode === 0x75) {
      console.log(`  [${chunkNum}] OP_DROP`);
      sIdx++;
    } else if (opcode === 0x51) {
      console.log(`  [${chunkNum}] OP_TRUE`);
      sIdx++;
    } else {
      console.log(`  [${chunkNum}] OP_0x${opcode.toString(16)}`);
      sIdx++;
    }
  }
  
  // Sequence
  const sequence = buf.readUInt32LE(offset);
  offset += 4;
  console.log('');
  console.log('Sequence:', sequence.toString(16));
}

// Output count
const outputCount = buf[offset];
offset += 1;
console.log('');
console.log('=== 输出解析 ===');
console.log('Output Count:', outputCount);

for (let i = 0; i < outputCount; i++) {
  console.log(`\n--- Output ${i} ---`);
  
  // Value (8 bytes)
  const valueLow = buf.readUInt32LE(offset);
  const valueHigh = buf.readUInt32LE(offset + 4);
  const value = valueLow + valueHigh * 0x100000000;
  offset += 8;
  console.log('Value:', value, 'satoshis (', (value / 100000000).toFixed(8), 'DOGE)');
  
  // Script length
  const scriptLen = buf[offset];
  offset += 1;
  
  // ScriptPubKey
  const scriptPubKey = buf.slice(offset, offset + scriptLen);
  offset += scriptLen;
  console.log('ScriptPubKey:', scriptPubKey.toString('hex'));
  
  // 解析 P2PKH
  if (scriptPubKey[0] === 0x76 && scriptPubKey[1] === 0xa9) {
    const pubKeyHash = scriptPubKey.slice(3, 23).toString('hex');
    console.log('Type: P2PKH');
    console.log('PubKeyHash:', pubKeyHash);
  }
}

// Locktime
const locktime = buf.readUInt32LE(offset);
console.log('');
console.log('Locktime:', locktime);
