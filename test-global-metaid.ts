/**
 * 测试 GlobalMetaId 生成
 */

import { convertToGlobalMetaId } from './src/lib/global-metaid'

// 测试用例
const testCases = [
  {
    address: '195gtuVbW9DsKPnSZLrt9kdJrQmvrAt7e3',
    expected: 'idq1tz3ljq763lqsj2wp894h06vxn0ndhnsq3fllnj',
    desc: 'MVC/BTC P2PKH'
  },
  {
    address: '1KAZD8sxTDkNzcjtCpKJ9ynPGsB8oryoFk',
    expected: 'idq1caqw2z0gn5gx3c79ach7s0p8h7ra3ggetcxu2a',
    desc: 'BTC Legacy P2PKH'
  },
  {
    address: 'DFo712BpLysLsoF6kSjTN6pPmZXxibtWcG',
    expected: 'idq1wnshx9kvz379ssjz38ku4q7vdwz36lg5hlr2gy',
    desc: 'Dogecoin P2PKH'
  },
  {
    address: 'bc1qfxd3xp3q65ulewmzrfx50pxw45qjfvgdsfq4ah',
    expected: 'idz1fxd3xp3q65ulewmzrfx50pxw45qjfvgd0j24uz',
    desc: 'BTC SegWit P2WPKH'
  },
  {
    address: 'bc1pj93y5u8q8uszm5mktzu0hxs5keras3kzzt06n7e0ky0qenwdt0yqawfyy0',
    expected: 'idt1j93y5u8q8uszm5mktzu0hxs5keras3kzzt06n7e0ky0qenwdt0yqqk89qy',
    desc: 'BTC Taproot P2TR'
  }
]

console.log('=== GlobalMetaId 生成测试 ===\n')

let passed = 0
let failed = 0

for (const tc of testCases) {
  try {
    const result = convertToGlobalMetaId(tc.address)
    const ok = result === tc.expected
    
    if (ok) {
      console.log(`✅ ${tc.desc}`)
      console.log(`   地址: ${tc.address}`)
      console.log(`   结果: ${result}`)
      passed++
    } else {
      console.log(`❌ ${tc.desc}`)
      console.log(`   地址: ${tc.address}`)
      console.log(`   期望: ${tc.expected}`)
      console.log(`   实际: ${result}`)
      failed++
    }
    console.log()
  } catch (e) {
    console.log(`❌ ${tc.desc} - 错误: ${e}`)
    failed++
  }
}

console.log(`\n总计: ${passed} 通过, ${failed} 失败`)
