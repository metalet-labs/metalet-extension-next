# Metalet Extension API Docs

# Overview

Metalet is an browser extension wallet based on **MetaidConnect** protocol.

Once you install your Metalet extension wallet in your browser, Metalet will inject an object called `metaidwallet` in the `window` object of your page.

You can call Metalet apis using `window.metaidwallet.{apiName}`

You can connect to your Metalet account and perform various operations such as checking your balance, transferring funds, and signing transactions.

There are two types of api actions: `authorize` and `query`.

- Calling an `authorize` action will pop up a window asking for permission to perform the requested action.
- Calling a `query` action will return the requested data directly.

---

# APIs

> Account-related.

## connect

Connect to the active account of Metalet.

### Parameters

Nope.

### Response

- `address` - `string`

### Example

```tsx
const account =
  (await metaidwallet.connect()) >
  {
    address: '1xxxxxxxx',
  }
```

## isConnected

Checks if the app is currently connected to the active account of Metalet.

### Parameters

Nope.

### Response

`boolean`

### Example

```tsx
;(await metaidwallet.isConnected()) > true
```

## disconnect

Disconnect. It functions as Logout.

### Parameters

Nope.

### Response

- `status` - `'ok'`

### Example

```tsx
;(await metaidwallet.disconnect()) >
  {
    status: 'ok',
  }
```

## getNetwork

Get the current network state.

### Parameters

-

### Response

- `network` - `'mainnet' | 'testnet'`

### Example

```tsx
;(await metaidwallet.getNetwork()) > { network: 'testnet' }
```

## switchNetwork

Switch the network state of the current account.

### Parameters

Nope.

### Response

- `address` - `string`
- `status` - `'OK'`
- `network` - `'mainnet' | 'testnet'`

### Example

```tsx
const account =
  (await metaidwallet.switchNetwork()) >
  {
    address: '1xxxxxxxx',
    status: 'OK',
    network: 'mainnet',
  }
```

## getAddress

`getAddress` retrieves the address of the connecting account.

### Parameters

Nope.

### Response

`address` - `string`

### Example

```tsx
const address = (await metaidwallet.getAddress()) > '1xxxxxxxxxxxxxxxxxx'
```

## getPublicKey

`getPublicKey` retrieves the public key of the connecting account.

### Parameters

Nope.

### Response

`publicKey` - `string`

### Example

```tsx
const publicKey = (await metaidwallet.getPublicKey()) > 'xxxxxxxthisisapubkeyxxxxx'
```

## **getXPublicKey**

`getXPublicKey` retrieves the extended public key of the connecting account.

### Parameters

Nope.

### Response

`xPublicKey` - `string`

### Example

```tsx
const xPublicKey = (await metaidwallet.getXPublicKey()) > 'xxxxxxxthisisaextendedpubkeyxxxxx'
```

---

> Native Token - aka. SPACE / BTC and so on…

## getBalance

retrieves the current balance of the connecting account.

### Parameters

Nope.

### Response

- `address` - `string`
- `confirmed` - `number`, use satoshi as unit
- `unconfirmed` - `number`, use satoshi as unit
- `total` - `number`, use satoshi as unit

### Example

```tsx
const balanceInfo =
  (await metaidwallet.getBalance()) >
  {
    address: '1xxxxxxxx',
    confirmed: 92316234,
    unconfirmed: 0,
    total: 92316234,
  }
```

## getUtxos - todo

## getActivities - todo

## transfer

The one-for-all transfer method.

### Parameters

- `tasks` - `TransferOutput[]`
  - `genesis?` - `string`, required when type is token
  - `codehash?` - `string`, required when type is token
  - `receivers` - `Reciever[]`
    - `amount` - `string`, do not pass numeric value here or Metalet will get upset.
    - `address` - `string`
- `broadcast?` - `boolean`, default to `true`

### Response

- `res` - `TaskResponse[]`
  - `id: number`, the chronological index of the task, starts from 1
  - `txid: string`
  - `txHex: string`
  - `routeCheckTxid?: string`, returned when it’s a token transfer transaction.
  - `routeCheckTxHex?: string`, returned when it’s a token transfer transaction.
- `txids` - `string[]`
- `broadcasted` - `boolean`

## merge

---

> Let’s sign something.

## signTransaction

Sign ONE transaction.

### Parameters

- `transaction` - `TransactionInfo`
  - `txHex: string`
  - `address: string`
  - `inputIndex: number`
  - `scriptHex: string`: the previous output script of this input
  - `satoshis: number`: the previous output satoshis value of this input
  - `sigtype?: number`: the sighash type

### Response

- `signature` - `SigInfo`
  - `publicKey: string`
  - `r: string`
  - `s: string`
  - `sig: string`
  - `sigtype: number`

### Example

```tsx
const signTxRes =
  (await metaidwallet.signTransaction({
    transaction: {
      txHex: 'xxxxxxxxx',
      address: '1F7XgiBcErvnsh54YgwQbhG7Mxp8Mig2Vj',
      inputIndex: 0,
      scriptHex: '76a91436521092539d313000ea730def268b522f0c588688ac',
      satoshis: 30000,
      sigtype: 65,
    },
  })) >
  {
    signature: {
      publicKey: '026887958bcc4cb6f8c04ea49260f0d10e312c41baf485252953b14724db552aac',
      r: '7d4857743ddd3817039cc4813fc6ea585a6d535dbcd4c2d9864d8afab54acf59',
      s: '380aaecd30f7e86f08917fa21c96958b56d0a0cd91413e4a34cd7fddb4f75587',
      sig: '304402207d4857743ddd3817039cc4813fc6ea585a6d535dbcd4c2d9864d8afab54acf590220380aaecd30f7e86f08917fa21c96958b56d0a0cd91413e4a34cd7fddb4f7558741',
    },
  }
```

## previewTransaction

Preview a transaction’s id before it is signed. Use this when you need to construct linear-dependent transactions.

### Parameters

- `transaction` - `TransactionInfo`
  - `txHex: string`
  - `address: string`
  - `inputIndex: number`
  - `scriptHex: string`: the previous output script of this input
  - `satoshis: number`: the previous output satoshis value of this input
  - `sigtype?: number`: the sighash type

### Response

- `txid`: `string`

### Example

```tsx
const previewTx =
  (await metaidwallet.previewTransaction({
    transaction: {
      txHex: 'xxxxxxxxx',
      address: '1F7XgiBcErvnsh54YgwQbhG7Mxp8Mig2Vj',
      inputIndex: 0,
      scriptHex: '76a91436521092539d313000ea730def268b522f0c588688ac',
      satoshis: 30000,
      sigtype: 65,
    },
  })) >
  {
    txid: 'abcthisisatxidjisdg...123',
  }
```

## signTransactions

Sign multiple transactions. Returns signed raw transaction list.

### Parameters

- `transactions` - `TransactionInfo[]`
  - `txHex: string`
  - `address?: string`
  - `inputIndex: number`
  - `scriptHex: string`: the previous output script of this input
  - `satoshis: number`: the previous output satoshis value of this input
  - `sigtype?: number`: the sighash type
  - `path?: string`: the sub derive path you are using. Default to `0/0`.
  - `hasMetaId?: boolean`: if this transaction is a MetaID transaction. If so, the op_return output will also be updated like we update the `prevTxId` in the input.
  - `dataDependsOn?: number`: the index of the transaction in the list your `OP_RETURN` data is depend on. Required when `hasMetaId` is `true`.

### Response

- `signedTransactions` - `Signed[]`
  - `txid: string`
  - `txHex: string`

### Example

```tsx
const signTxRes =
  (await metaidwallet.signTransactions({
    transactions: [
      {
        txHex: 'xxxxxxxxx',
        address: '1F7XgiBcErvnsh54YgwQbhG7Mxp8Mig2Vj',
        inputIndex: 0,
        scriptHex: '76a91436521092539d313000ea730def268b522f0c588688ac',
        satoshis: 30000,
        sigtype: 65,
      },
      {
        // Assume that this transaction is dependent on the first one.
        // Therefore the prevTxId of this transaction's input might not be accurate.
        // This api will automatically recalculate the correct txid for you and replace it accordingly.
        txHex: 'xxxxxxxxx',
        address: '1F7XgiBcErvnsh54YgwQbhG7Mxp8Mig2Vj',
        inputIndex: 0,
        scriptHex: '76a91436521092539d313000ea730def268b522f0c588688ac',
        satoshis: 30000,
        sigtype: 65,
        path: '0/3',
        hasMetaId: true,
      },
    ],
  })) >
  // If the transactions are dependent, you have to broadcast them sequentially.
  {
    signedTransactions: [
      {
        txid: 'xxxxxxxxxx',
        txHex: 'xxxxxxxxxx',
      },
      {
        txid: 'xxxxxxxxxx',
        txHex: 'xxxxxxxxxx',
      },
    ],
  }
```

## pay

Pay for a batch of MVC transactions. This API is used to sign and pay for multiple transactions at once, commonly used in MetaID protocol operations.

### Parameters

- `transactions` - `SigningTransaction[]` - Array of transactions to sign and pay
  - `txComposer` - `string`: Serialized transaction composer
  - `message?` - `string`: Optional message describing the transaction purpose
- `hasMetaid?` - `boolean`: Whether this is a MetaID transaction. If `true`, the OP_RETURN output will be updated with correct txid references. Default: `false`
- `feeb?` - `number`: Fee rate in satoshis per byte. Default: `1`

### Response

- `payedTransactions` - `string[]`: Array of serialized signed transaction composers

### Example

```tsx
import { TxComposer, mvc } from 'meta-contract'

// Build a transaction using TxComposer
const txComposer = new TxComposer()

// Add outputs (e.g., OP_RETURN for MetaID data)
const opReturnData = ['metaid', 'buzz', JSON.stringify({ content: 'Hello MetaID!' })]
txComposer.appendOpReturnOutput(mvc.Script.buildSafeDataOut(opReturnData))

// Add P2PKH output if needed
const receiverAddress = mvc.Address.fromString('your_receiver_address')
txComposer.appendP2PKHOutput({
  address: receiverAddress,
  satoshis: 1000,
})

// Call pay API to sign and add inputs for the transaction
const { payedTransactions } = await window.metaidwallet.pay({
  transactions: [
    {
      txComposer: txComposer.serialize(),
      message: 'Create a buzz',
    },
  ],
  hasMetaid: true,
  feeb: 1,
})

// Deserialize the signed transactions
const signedTxComposer = TxComposer.deserialize(payedTransactions[0])

// Get the raw transaction hex for broadcasting
const txHex = signedTxComposer.getRawHex()
const txid = signedTxComposer.getTxId()
console.log('Transaction ID:', txid)
```

```tsx
// Multiple transactions with dependencies
import { TxComposer, mvc } from 'meta-contract'

const tx1 = new TxComposer()
tx1.appendOpReturnOutput(mvc.Script.buildSafeDataOut(['metaid', 'root']))

const tx2 = new TxComposer()
tx2.appendOpReturnOutput(mvc.Script.buildSafeDataOut(['metaid', 'child', tx1.getTxId()])) // References tx1

const { payedTransactions } = await window.metaidwallet.pay({
  transactions: [
    { txComposer: tx1.serialize(), message: 'Create root' },
    { txComposer: tx2.serialize(), message: 'Create child' },
  ],
  hasMetaid: true, // Will auto-update txid references in OP_RETURN
})

console.log('Signed transactions:', payedTransactions)
```

### Notes

- This API will pop up a confirmation window for user approval
- When `hasMetaid` is `true`, the wallet will automatically update the OP_RETURN output to reflect correct txid references for dependent transactions
- Transactions are processed sequentially to handle dependencies between them
- The returned `payedTransactions` are serialized transaction composers that can be deserialized and broadcast

## autoPayment
### Example

```tsx
// check status 
const res = await window.metaidwallet.autoPaymentStatus()
// {
//     "isEnabled": true,
//     "isApproved": false,
//     "autoPaymentAmount": 10000
// }
// only isEnabled === true && isApproved === false
 await window.metaidwallet.autoPayment()
//  {message: 'Auto payment approved'}

await window.metaidwallet.smallPay(params:any)


```


## signMessage

## signMsg

---

## Token

### list

### getBalance

Get the balance info of the token.

If no parameter is provided, the function will return all token information owned by the current account.

### Parameters

- `genesis` - `string`, the genesis of the token - `optional`
- `codehash` - `string`, the codehash of the token - `optional`

### Response

- `TokenInfo[]`
  - `codehash` - `string`, the codehash of the token
  - `genesis` - `string`, the genesis of the token
  - `name` - `string`
  - `symbol` - `string`
  - `decimal` - `number`
  - `utxoCount` - `number`, the utxo count of this token the account owned
  - `confirmed` - `number`
  - `confirmedString` - `string`
  - `unconfirmed` - `number`
  - `unconfirmedString` - `string`

### Example

```tsx
const balanceInfo = await metaidwallet.token.getBalance()

> [
    {
        "codehash": "a2421f1e90c6048c36745edd44fad682e8644693",
        "genesis": "039032ade3d49a6d4ff41c33b3d63ea5c986f310",
        "name": "Test Token - 20:39",
        "symbol": "RR",
        "decimal": 18,
        "utxoCount": 2,
        ****"confirmed": 1000,
        "confirmedString": "1000",
        "unconfirmed": 0,
        "unconfirmedString": "0"
    },
    {
        "codehash": "57344f46cc0d0c8dfea7af3300b1b3a0f4216c04",
        "genesis": "76a8a2122b4f4213921cb0b4de0e7c704628f149",
        "name": "SPACE-MIT",
        "symbol": "SMIT",
        "decimal": 8,
        "utxoCount": 1,
        "confirmed": 19000009847,
        "confirmedString": "19000009847",
        "unconfirmed": 0,
        "unconfirmedString": "0"
    }
]
```

### merge

### getActivities

---

## NFT

### list

### getActivities

### transfer

---

# Observable Events

Use `metaidwallet.on` API to attach your event handler to these events.

### accountsChanged

```tsx
// attach an event listener to `accountsChanged` event
metaidwallet.on('accountsChanged', (newAccount) => console.log(newAccount)) >
  {
    mvcAddress: '1kdiyourmvcaddress234',
    btcAddress: 'bc1pyourbtcaddress234',
  }

// remove the event listener
metaidwallet.removeListener('accountsChanged')
```

### networkChanged

```tsx
// attach an event listener to `networkChanged` event
metaidwallet.on('networkChanged', (network: string) => console.log(network)) > 'mainnet'

// remove the event listener
metaidwallet.removeListener('networkChanged')
```

---

# Deprecating APIs

These APIs are going to be deprecated in the future.

## requestAccount

<aside>
⚠️ Alias of  `connect`

</aside>

Connect to the active account of Metalet.

### Parameters

Nope.

### Response

- `address` - `string`

### Example

```tsx
const account =
  (await metaidwallet.requestAccount()) >
  {
    address: '1xxxxxxxx',
  }
```

## getAccount

<aside>
⚠️ Alias of  `connect`

</aside>

Connect to the active account of Metalet.

### Parameters

Nope.

### Response

- `address` - `string`

### Example

```tsx
const account =
  (await metaidwallet.getAccount()) >
  {
    address: '1xxxxxxxx',
  }
```

## exitAccount

<aside>
⚠️ Alias of  `disconnect`

</aside>

### Parameters

Nope.

### Response

- `status` - `'ok'`

### Example

```tsx
;(await metaidwallet.exitAccount()) >
  {
    status: 'ok',
  }
```

## getMvcBalance

<aside>
⚠️ Alias of  `getBalance`

</aside>

### Example

```tsx
const balanceInfo =
  (await metaidwallet.getMvcBalance()) >
  {
    address: '1xxxxxxxx',
    confirmed: 92316234,
    unconfirmed: 0,
    total: 92316234,
  }
```

## signTx

<aside>
⚠️ This API is going to be deprecated in the future.
Please use **signTransactions** instead.

</aside>

Sign transactions.

### Parameters

- `list` - `TransactionInfo[]`
  - `txHex: string`
  - `address: string`
  - `inputIndex: number`
  - `scriptHex: string`: the previous output script of this input
  - `satoshis: number`: the previous output satoshis value of this input
  - `sigtype: number`: the sighash type

### Response

- `sigList` - `SigInfo[]`
  - `publicKey: string`
  - `r: string`
  - `s: string`
  - `sig: string`

### Example

```tsx
const signTxRes =
  (await metaidwallet.signTx({
    list: [
      {
        txHex: 'xxxxxxxxx',
        address: '1F7XgiBcErvnsh54YgwQbhG7Mxp8Mig2Vj',
        inputIndex: 0,
        scriptHex: '76a91436521092539d313000ea730def268b522f0c588688ac',
        satoshis: 30000,
        sigtype: 65,
      },
    ],
  })) >
  {
    sigList: [
      {
        publicKey: '026887958bcc4cb6f8c04ea49260f0d10e312c41baf485252953b14724db552aac',
        r: '7d4857743ddd3817039cc4813fc6ea585a6d535dbcd4c2d9864d8afab54acf59',
        s: '380aaecd30f7e86f08917fa21c96958b56d0a0cd91413e4a34cd7fddb4f75587',
        sig: '304402207d4857743ddd3817039cc4813fc6ea585a6d535dbcd4c2d9864d8afab54acf590220380aaecd30f7e86f08917fa21c96958b56d0a0cd91413e4a34cd7fddb4f7558741',
      },
    ],
  }
```
