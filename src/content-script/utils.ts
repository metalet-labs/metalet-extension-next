import CryptoJS from 'crypto-js'

const Utf8 = CryptoJS.enc.Utf8
const iv = Utf8.parse('0000000000000000')

/**
 * AES 加密（群聊加密，CBC 模式，返回 hex）
 * @param data 要加密的数据（字符串）
 * @param key 加密密钥（16位字符串）
 * @returns 加密后的 hex 字符串
 */
export function encrypt(data: string, key: string): string {
  const messageWordArray = Utf8.parse(data)
  const secretKey = Utf8.parse(key)

  const encrypted = CryptoJS.AES.encrypt(messageWordArray, secretKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  const _encryptedBuf = Buffer.from(encrypted.toString(), 'base64')

  return _encryptedBuf.toString('hex')
}

/**
 * AES 解密（群聊解密，CBC 模式，输入 hex）
 * @param encryptedHex 加密后的 hex 字符串
 * @param key 解密密钥（16位字符串）
 * @returns 解密后的字符串
 */
export function decrypt(encryptedHex: string, key: string): string {
  const secretKey = Utf8.parse(key)

  try {
    const messageBuffer = Buffer.from(encryptedHex, 'hex')
    const messageBase64 = messageBuffer.toString('base64')

    const messageBytes = CryptoJS.AES.decrypt(messageBase64, secretKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })

    return messageBytes.toString(Utf8)
  } catch {
    return encryptedHex
  }
}

/**
 * AES 加密（使用 CBC 模式和 PKCS7 填充）
 * @param data 要加密的数据
 * @param key 密钥（会被 SHA256 处理成 256 位密钥）
 * @param iv 初始化向量（可选，默认使用密钥的 MD5）
 * @returns Base64 编码的加密字符串
 */
export function encryptAesCBC(data: string, key: string, iv?: string): string {
  const keyHash = CryptoJS.SHA256(key)
  const ivHash = iv ? CryptoJS.enc.Utf8.parse(iv.padEnd(16, '0').slice(0, 16)) : CryptoJS.MD5(key)

  const encrypted = CryptoJS.AES.encrypt(data, keyHash, {
    iv: ivHash,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return encrypted.toString()
}

/**
 * AES 解密（使用 CBC 模式和 PKCS7 填充）
 * @param encryptedData Base64 编码的加密字符串
 * @param key 密钥（会被 SHA256 处理成 256 位密钥）
 * @param iv 初始化向量（可选，默认使用密钥的 MD5）
 * @returns 解密后的字符串
 */
export function decryptAesCBC(encryptedData: string, key: string, iv?: string): string {
  const keyHash = CryptoJS.SHA256(key)
  const ivHash = iv ? CryptoJS.enc.Utf8.parse(iv.padEnd(16, '0').slice(0, 16)) : CryptoJS.MD5(key)

  const decrypted = CryptoJS.AES.decrypt(encryptedData, keyHash, {
    iv: ivHash,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return decrypted.toString(CryptoJS.enc.Utf8)
}

/**
 * SHA256 哈希
 * @param data 要哈希的数据
 * @returns 哈希后的十六进制字符串
 */
export function sha256(data: string): string {
  return CryptoJS.SHA256(data).toString()
}

/**
 * MD5 哈希
 * @param data 要哈希的数据
 * @returns 哈希后的十六进制字符串
 */
export function md5(data: string): string {
  return CryptoJS.MD5(data).toString()
}

/**
 * Base64 编码
 * @param data 要编码的数据
 * @returns Base64 编码后的字符串
 */
export function base64Encode(data: string): string {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data))
}

/**
 * Base64 解码
 * @param data Base64 编码的字符串
 * @returns 解码后的字符串
 */
export function base64Decode(data: string): string {
  return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(data))
}

/**
 * HMAC-SHA256 签名
 * @param data 要签名的数据
 * @param key 密钥
 * @returns 签名后的十六进制字符串
 */
export function hmacSha256(data: string, key: string): string {
  return CryptoJS.HmacSHA256(data, key).toString()
}

// 导出所有工具函数作为 utils 对象
export const utils = {
  encrypt,
  decrypt,
  encryptAesCBC,
  decryptAesCBC,
  sha256,
  md5,
  base64Encode,
  base64Decode,
  hmacSha256,
}

export default utils
