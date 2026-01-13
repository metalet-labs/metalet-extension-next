const txHex = '0200000002858d9cae1122c95a15fcec1aaa7878c1177d315d97cea96aef46089a50a2dac800000000fde601066d657461696406637265617465106170706c69636174696f6e2f6a736f6e013005312e302e304c5d6263317032306b33783263346d676c6678723577613573677467656368777374706c6438306b727532636734676d6d3475727675617171737661707875303a2f70726f746f636f6c732f73696d706c6566696c6567726f7570636861744ce97b2274696d657374616d70223a313736373632383837342c22656e6372797074223a22616573222c2266696c6554797065223a22706e67222c2267726f75704964223a22333936383039353732663933366336363937393735353437376231356165396164666539666165313139626461626238663366666239613336326131373664306930222c226e69636b4e616d65223a2253756e6e792046756e67222c226174746163686d656e74223a226d65746166696c653a2f2f5b6f626a656374204f626a6563745d6930222c227265706c7950696e223a22222c226368616e6e656c4964223a22227d483045022100e4c6cfa2b2e13827c9f5fa7a94bbcae3f8ed0de874057206c5fd539242cae60a022066557096dcc1bc53274b398739f8d4c66b5cd6f307826d21255e97f474bb30c0012b21021789b7f7687733e6ac61b3812a13526f8795a5723877660b29e0e40c17922b35ad7575757575757551ffffffff858d9cae1122c95a15fcec1aaa7878c1177d315d97cea96aef46089a50a2dac8010000006b483045022100d460b35e5f00c58bbb38bea72766d1a0ee76a8551a6e7a508554cadea6146fe2022017128f725c7dbb1eba738aabf0065621ec746f4c21cc1367a41c8e27e0c97c5001210394fd32b33cad4f73949c08160b85a37596a5d80078b7adbd6cffadee6e7f249dffffffff02a0860100000000001976a914127a261ba0d178ed2cd98e5d8cc5f9712e42f7db88ac2049470e000000001976a914127a261ba0d178ed2cd98e5d8cc5f9712e42f7db88ac00000000';

const buf = Buffer.from(txHex, 'hex');
let offset = 0;

console.log('='.repeat(70));
console.log('DOGE 交易解析');
console.log('='.repeat(70));

// Version
const version = buf.readUInt32LE(offset);
offset += 4;
console.log('\n【版本】:', version);

// Input count
const inputCount = buf[offset];
offset += 1;
console.log('【输入数量】:', inputCount);

console.log('\n' + '='.repeat(70));
console.log('输入解析');
console.log('='.repeat(70));

for (let i = 0; i < inputCount; i++) {
  console.log('\n--- 输入', i, '---');
  
  const prevTxHash = buf.slice(offset, offset + 32).reverse().toString('hex');
  offset += 32;
  console.log('前一笔交易 TxId:', prevTxHash);
  
  const prevIndex = buf.readUInt32LE(offset);
  offset += 4;
  console.log('前一笔输出索引:', prevIndex);
  
  let scriptLen = buf[offset];
  offset += 1;
  if (scriptLen === 0xfd) {
    scriptLen = buf.readUInt16LE(offset);
    offset += 2;
  }
  console.log('ScriptSig 长度:', scriptLen, 'bytes');
  
  const scriptSig = buf.slice(offset, offset + scriptLen);
  offset += scriptLen;
  
  console.log('\nScriptSig 数据块解析:');
  
  let sIdx = 0;
  let chunkNum = 0;
  while (sIdx < scriptSig.length) {
    const opcode = scriptSig[sIdx];
    chunkNum++;
    
    if (opcode >= 1 && opcode <= 75) {
      const data = scriptSig.slice(sIdx + 1, sIdx + 1 + opcode);
      sIdx += 1 + opcode;
      
      const isText = data.every(b => b >= 32 && b < 127);
      if (isText && opcode < 100) {
        const txt = data.toString('utf8');
        if (txt.startsWith('{')) {
          console.log(`  [${chunkNum}] PUSH_${opcode} (JSON):`);
          try {
            console.log('       ' + JSON.stringify(JSON.parse(txt), null, 2).split('\n').join('\n       '));
          } catch { console.log('       ' + txt); }
        } else {
          console.log(`  [${chunkNum}] PUSH_${opcode}: "${txt}"`);
        }
      } else if (opcode === 33 && (data[0] === 0x02 || data[0] === 0x03)) {
        console.log(`  [${chunkNum}] PUSH_33 (压缩公钥): ${data.toString('hex')}`);
      } else if (opcode >= 71 && opcode <= 73) {
        console.log(`  [${chunkNum}] PUSH_${opcode} (DER签名): ${data.toString('hex').slice(0, 60)}...`);
      } else if (opcode === 43) {
        console.log(`  [${chunkNum}] PUSH_43 (Redeem Script): ${data.toString('hex')}`);
        console.log('       Redeem Script 内部结构:');
        let rIdx = 0;
        while (rIdx < data.length) {
          const rop = data[rIdx];
          if (rop === 0x21) {
            console.log('         PUSH_33 (公钥):', data.slice(rIdx+1, rIdx+34).toString('hex'));
            rIdx += 34;
          } else if (rop === 0xad) { console.log('         OP_CHECKSIGVERIFY'); rIdx++; }
          else if (rop === 0x75) { console.log('         OP_DROP'); rIdx++; }
          else if (rop === 0x51) { console.log('         OP_TRUE'); rIdx++; }
          else { console.log('         OP_0x' + rop.toString(16)); rIdx++; }
        }
      } else {
        console.log(`  [${chunkNum}] PUSH_${opcode}: ${data.toString('hex').slice(0,60)}${data.length > 30 ? '...' : ''}`);
      }
    } else if (opcode === 0x4c) { // OP_PUSHDATA1
      const dataLen = scriptSig[sIdx + 1];
      const data = scriptSig.slice(sIdx + 2, sIdx + 2 + dataLen);
      sIdx += 2 + dataLen;
      
      try {
        const txt = data.toString('utf8');
        const isText = [...txt].every(c => c.charCodeAt(0) >= 32);
        if (isText) {
          if (txt.startsWith('{')) {
            console.log(`  [${chunkNum}] OP_PUSHDATA1_${dataLen} (JSON):`);
            try {
              console.log('       ' + JSON.stringify(JSON.parse(txt), null, 2).split('\n').join('\n       '));
            } catch { console.log('       ' + txt); }
          } else {
            console.log(`  [${chunkNum}] OP_PUSHDATA1_${dataLen}: "${txt}"`);
          }
        } else { throw new Error(); }
      } catch {
        console.log(`  [${chunkNum}] OP_PUSHDATA1_${dataLen}: ${data.toString('hex').slice(0,60)}...`);
      }
    } else if (opcode === 0x75) { console.log(`  [${chunkNum}] OP_DROP`); sIdx++; }
    else if (opcode === 0x51) { console.log(`  [${chunkNum}] OP_TRUE`); sIdx++; }
    else { console.log(`  [${chunkNum}] OP_0x${opcode.toString(16)}`); sIdx++; }
  }
  
  const sequence = buf.readUInt32LE(offset);
  offset += 4;
  console.log('\n序列号: 0x' + sequence.toString(16).padStart(8, '0'));
}

const outputCount = buf[offset];
offset += 1;

console.log('\n' + '='.repeat(70));
console.log('输出解析 (共', outputCount, '个)');
console.log('='.repeat(70));

for (let i = 0; i < outputCount; i++) {
  console.log('\n--- 输出', i, '---');
  
  const value = Number(buf.readBigUInt64LE(offset));
  offset += 8;
  console.log('金额:', value, 'satoshis (' + (value / 100000000).toFixed(8) + ' DOGE)');
  
  const scriptLen = buf[offset];
  offset += 1;
  
  const scriptPubKey = buf.slice(offset, offset + scriptLen);
  offset += scriptLen;
  console.log('ScriptPubKey:', scriptPubKey.toString('hex'));
  
  if (scriptPubKey[0] === 0x76 && scriptPubKey[1] === 0xa9) {
    const pubkeyHash = scriptPubKey.slice(3, 23);
    console.log('类型: P2PKH');
    console.log('PubKeyHash:', pubkeyHash.toString('hex'));
  }
}

const locktime = buf.readUInt32LE(offset);
console.log('\n【锁定时间】:', locktime);

console.log('\n' + '='.repeat(70));
console.log('MetaID 协议数据总结');
console.log('='.repeat(70));
