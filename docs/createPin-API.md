# createPin API 设计文档

> 统一的跨链 MetaID PIN 创建接口，支持 BTC、MVC、DOGE 三条链。

## 概述

`createPin` 方法整合了三条链的 PIN 创建功能：
- **BTC**: 基于 Taproot 的铭刻
- **DOGE**: 基于 P2SH 的铭刻  
- **MVC**: 基于 OP_RETURN 的 PIN

---

## 请求参数

### CreatePinParams

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `chain` | `'btc' \| 'mvc' \| 'doge'` | ✅ | 目标链 |
| `dataList` | `PinDetail[]` | ✅ | PIN 数据列表 |
| `feeRate` | `number` | ❌ | 费率 |
| `noBroadcast` | `boolean` | ❌ | 是否不广播，仅返回原始交易 hex |

```typescript
type CreatePinParams = {
  chain: 'btc' | 'mvc' | 'doge'
  dataList: PinDetail[]
  feeRate?: number
  noBroadcast?: boolean
}
```

---

### PinDetail

每个 PIN 的完整配置，包含数据和选项。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `metaidData` | `MetaidData` | ✅ | PIN 元数据 |
| `options` | `PinOptions` | ❌ | 可选配置 |

```typescript
type PinDetail = {
  metaidData: MetaidData
  options?: PinOptions
}
```

---

### MetaidData

PIN 的核心数据结构。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `operation` | `Operation` | ✅ | 操作类型 |
| `path` | `string` | ❌ | 路径，如 `/protocols/simplebuzz` |
| `body` | `string \| Buffer` | ❌ | 内容 |
| `contentType` | `string` | ❌ | 内容类型，如 `text/plain`, `application/json` |
| `encryption` | `'0' \| '1' \| '2'` | ❌ | 加密类型 |
| `version` | `string` | ❌ | 版本号 |
| `encoding` | `BufferEncoding` | ❌ | body 的编码方式 |
| `flag` | `'metaid'` | ❌ | 标识 |
| `revealAddr` | `string` | ❌ | (BTC/DOGE) reveal 交易接收地址，不填则默认使用当前钱包地址 |

```typescript
type Operation = 'init' | 'create' | 'modify' | 'revoke'

type MetaidData = {
  operation: Operation
  path?: string
  body?: string | Buffer
  contentType?: string
  encryption?: '0' | '1' | '2'
  version?: string
  encoding?: BufferEncoding  // 'utf-8' | 'base64' | 'hex' | ...
  flag?: 'metaid'
  revealAddr?: string  // (BTC/DOGE) reveal 交易接收地址
}
```

**加密类型说明：**
- `'0'`: 不加密
- `'1'`: ECIES 加密
- `'2'`: ECDH 协商密钥加密

---

### PinOptions

每个 PIN 的可选配置。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `outputs` | `Output[]` | ❌ | 额外输出（转账到其他地址） |
| `service` | `Output` | ❌ | 服务费输出 |
| `refs` | `Record<string, number>` | ❌ | 引用替换规则 |

```typescript
type Output = {
  address: string
  satoshis: string
}

type PinOptions = {
  outputs?: Output[]
  service?: Output
  refs?: {
    [placeholder: string]: number
  }
}
```

**refs 说明：**

用于处理交易依赖场景（如发送带图片的 Buzz）。

- `key`: body 中的占位符字符串
- `value`: dataList 中的索引，运行时替换为该交易的 txid

---

## 返回结果

### CreatePinResult

| 字段 | 类型 | 适用链 | 说明 |
|------|------|--------|------|
| `commitTxId` | `string` | BTC/DOGE | commit 交易 ID |
| `revealTxIds` | `string[]` | BTC/DOGE | reveal 交易 ID 列表 |
| `commitTxHex` | `string` | BTC/DOGE | commit 交易 hex (noBroadcast) |
| `revealTxsHex` | `string[]` | BTC/DOGE | reveal 交易 hex 列表 (noBroadcast) |
| `txids` | `string[]` | MVC | 交易 ID 列表 |
| `txHexList` | `string[]` | MVC | 交易 hex 列表 (noBroadcast) |
| `commitCost` | `number` | ALL | commit 交易费用 (satoshis) |
| `revealCost` | `number` | ALL | reveal 交易费用 (satoshis) |
| `totalCost` | `number` | ALL | 总费用 (satoshis) |

```typescript
type CreatePinResult = {
  // BTC/DOGE
  commitTxId?: string
  revealTxIds?: string[]
  commitTxHex?: string
  revealTxsHex?: string[]
  
  // MVC
  txids?: string[]
  txHexList?: string[]
  
  // 费用统计
  commitCost?: number
  revealCost?: number
  totalCost: number
}
```

---

## 使用示例

### 示例 1：创建简单的文本 PIN

```typescript
const result = await metaidwallet.createPin({
  chain: 'btc',
  dataList: [
    {
      metaidData: {
        operation: 'create',
        path: '/info/name',
        body: 'Alice',
        contentType: 'text/plain',
      }
    }
  ],
  feeRate: 10,
})

// 返回
// {
//   commitTxId: 'abc123...',
//   revealTxIds: ['def456...'],
//   commitCost: 1500,
//   revealCost: 800,
//   totalCost: 2300
// }
```

### 示例 2：批量创建多个 PIN

```typescript
const result = await metaidwallet.createPin({
  chain: 'mvc',
  dataList: [
    {
      metaidData: {
        operation: 'create',
        path: '/info/name',
        body: 'Alice',
        contentType: 'text/plain',
      }
    },
    {
      metaidData: {
        operation: 'create',
        path: '/info/bio',
        body: 'Hello World',
        contentType: 'text/plain',
      }
    }
  ],
  feeRate: 1,
})

// 返回
// {
//   txids: ['tx1...', 'tx2...'],
//   totalCost: 500
// }
```

### 示例 3：上传图片并发布 Buzz（带依赖引用）

```typescript
const result = await metaidwallet.createPin({
  chain: 'btc',
  dataList: [
    // 第 0 笔：上传图片
    {
      metaidData: {
        operation: 'create',
        path: '/file',
        body: imageBase64,
        contentType: 'image/png',
        encoding: 'base64',
      }
    },
    // 第 1 笔：发布 Buzz，引用图片
    {
      metaidData: {
        operation: 'create',
        path: '/protocols/simplebuzz',
        body: JSON.stringify({
          content: '今天天气真好！',
          attachments: ['metafile://{{img}}i0']
        }),
        contentType: 'application/json',
      },
      options: {
        refs: {
          '{{img}}': 0  // {{img}} 替换为第 0 笔交易的 reveal txid
        }
      }
    }
  ],
  feeRate: 10,
})

// 返回
// {
//   commitTxId: 'commit123...',
//   revealTxIds: ['reveal_img...', 'reveal_buzz...'],
//   totalCost: 5000
// }
```

### 示例 4：带服务费和额外输出

```typescript
const result = await metaidwallet.createPin({
  chain: 'doge',
  dataList: [
    {
      metaidData: {
        operation: 'create',
        path: '/protocols/simplebuzz',
        body: JSON.stringify({ content: 'Hello DOGE!' }),
        contentType: 'application/json',
      },
      options: {
        service: {
          address: 'DServiceAddress...',
          satoshis: '10000000'  // 0.1 DOGE
        },
        outputs: [
          {
            address: 'DReceiverAddress...',
            satoshis: '50000000'  // 0.5 DOGE
          }
        ]
      }
    }
  ],
  feeRate: 100000,  // DOGE: satoshis/KB
})
```

### 示例 5：不广播，仅获取交易 hex

```typescript
const result = await metaidwallet.createPin({
  chain: 'btc',
  dataList: [
    {
      metaidData: {
        operation: 'create',
        path: '/info/name',
        body: 'Alice',
      }
    }
  ],
  feeRate: 10,
  noBroadcast: true,
})

console.log(result.commitTxHex)    // 原始 commit 交易
console.log(result.revealTxsHex)   // 原始 reveal 交易列表
console.log(result.totalCost)      // 总费用
```

---

## 各链差异

| 特性 | BTC | DOGE | MVC |
|------|-----|------|-----|
| 费率单位 | satoshis/vByte | satoshis/KB | satoshis/byte |
| 交易结构 | 1 commit + N reveal | 1 commit + N reveal | N 个独立交易 |
| 返回字段 | commitTxId, revealTxIds | commitTxId, revealTxIds | txids |
| refs 替换目标 | reveal txid | reveal txid | 交易 txid |
| 铭刻方式 | Taproot | P2SH | OP_RETURN |

---

## 待讨论问题

1. **refs 占位符格式**：目前使用用户自定义格式如 `{{img}}`，是否需要统一规范？

2. **service 和 outputs 的区别**：
   - `service`: 服务费，语义明确
   - `outputs`: 通用的额外输出
   - 是否需要合并成一个字段？

3. **错误处理**：失败时的返回格式？部分成功如何处理？

4. **费率默认值**：各链是否需要提供智能费率估算？

---

## 完整类型定义

```typescript
// 操作类型
type Operation = 'init' | 'create' | 'modify' | 'revoke'

// 输出结构
type Output = {
  address: string
  satoshis: string
}

// PIN 元数据
type MetaidData = {
  operation: Operation
  path?: string
  body?: string | Buffer
  contentType?: string
  encryption?: '0' | '1' | '2'
  version?: string
  encoding?: BufferEncoding
  flag?: 'metaid'
  revealAddr?: string  // (BTC/DOGE) reveal 交易接收地址
}

// PIN 选项
type PinOptions = {
  outputs?: Output[]
  service?: Output
  refs?: Record<string, number>
}

// PIN 详情
type PinDetail = {
  metaidData: MetaidData
  options?: PinOptions
}

// 请求参数
type CreatePinParams = {
  chain: 'btc' | 'mvc' | 'doge'
  dataList: PinDetail[]
  feeRate?: number
  noBroadcast?: boolean
}

// 返回结果
type CreatePinResult = {
  commitTxId?: string
  revealTxIds?: string[]
  commitTxHex?: string
  revealTxsHex?: string[]
  txids?: string[]
  txHexList?: string[]
  commitCost?: number
  revealCost?: number
  totalCost: number
}
```
