import { network } from '@/lib/network'
import { getCredential } from '@/lib/account'
import {
  METASV_TESTNET_HOST,
  METASV_HOST,
  METALET_HOST,
  API2_ORDERS_EXCHANGE,
  API2_ORDERS_EXCHANGE_TESTNET,
  UNISAT_HOST,
  MEMPOOL_HOST,
  ORDINALS_HOST,
  UNISAT_TESTNET_HOST,
} from '@/data/hosts'

type OptionParams = Record<string, string | number | undefined>

interface OptionData {
  [key: string]: unknown
}

interface RequestOption {
  method: 'GET' | 'POST'
  data?: OptionData | string
  params?: OptionParams
  headers?: Headers
  mode?: RequestMode
  withCredential?: boolean
  body?: string | URLSearchParams
}

async function request<T = any>(url: string, options: RequestOption): Promise<T> {
  if (!options?.headers) {
    options.headers = new Headers()
  }
  // if (options?.withCredential) {
  //   const { publicKey, signature } = await getCredential()
  //   options.headers.set('X-Signature', signature)
  //   options.headers.set('X-Public-Key', publicKey)
  // }
  if (options?.params) {
    let cleanedParams = Object.entries(options.params ?? {})
      .filter(([, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value!.toString() }), {})
    if (options.method === 'GET') {
      const params = new URLSearchParams(cleanedParams)
      url = `${url}?${params.toString()}`
    } else {
      // UNUSED: Params will not be processed in POST request
      options.body = new URLSearchParams(cleanedParams)
    }
    delete options.params
    options.headers.set('Content-Type', 'application/x-www-form-urlencoded')
  }

  if (options?.data) {
    if (options.headers.get('Content-Type') === 'text/plain') {
      options.body = options.data as string
    } else {
      options.body = JSON.stringify(options.data)
      if (!options.headers.has('Content-Type')) {
        options.headers.set('Content-Type', 'application/json')
      }
    }
    delete options.data
  }

  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  const data = await response.text()
  try {
    return JSON.parse(data)
  } catch (error) {
    return data as T
  }
}

export const createApi = (host: string) => {
  return (path: string) => {
    return {
      get: (params?: OptionParams) => request(`${host}${path}`, { method: 'GET', params }),
      post: (data?: OptionData) => request(`${host}${path}`, { method: 'POST', data }),
    }
  }
}

export const mvcApi = <T>(path: string) => {
  const metasvHost = network.value === 'mainnet' ? METASV_HOST : METASV_TESTNET_HOST
  return {
    get: (params?: OptionParams) => request<T>(`${metasvHost}${path}`, { method: 'GET', params }),
    post: (data?: OptionData) => request<T>(`${metasvHost}${path}`, { method: 'POST', data }),
  }
}

export const metaletApi = <T>(path: string) => {
  const metaletHost = METALET_HOST + '/wallet-api/v1'
  return {
    get: (params?: OptionParams) =>
      metaletV3Request<T>(`${metaletHost}${path}`, { method: 'GET', params, withCredential: true }),
    post: (data?: OptionData) =>
      metaletV3Request<T>(`${metaletHost}${path}`, { method: 'POST', data, withCredential: true }),
  }
}

export const metaletApiV2 = <T>(path: string) => {
  if (network.value === 'mainnet') {
    const metaletHost = `${METALET_HOST}/wallet-api/v2`
    return {
      get: (params?: OptionParams) =>
        metaletV3Request<T>(`${metaletHost}${path}`, { method: 'GET', params, mode: 'cors' }),
      post: (data?: OptionData) => metaletV3Request<T>(`${metaletHost}${path}`, { method: 'POST', data, mode: 'cors' }),
    }
  }
  return {
    get: (params?: OptionParams) =>
      unisatRequest<T>(`${UNISAT_TESTNET_HOST}${path}`, { method: 'GET', params, mode: 'cors' }),
    post: (data?: OptionData) =>
      unisatRequest<T>(`${UNISAT_TESTNET_HOST}${path}`, { method: 'POST', data, mode: 'cors' }),
  }
}

enum MetaletV3_CODE {
  SUCCESS = 0,
  FAILED = 1,
}

interface MetaletV3Result<T> {
  code: MetaletV3_CODE
  message: string
  data: T
  processingTime: number
}

const metaletV3Request = <T>(url: string, options: RequestOption): Promise<T> =>
  request<MetaletV3Result<T>>(url, options).then((result) => {
    if (result.code === MetaletV3_CODE.FAILED) {
      throw new Error(result.message)
    }
    return result.data
  })

export const metaletApiV3 = <T>(path: string) => {
  const metaletHost = METALET_HOST + '/wallet-api/v3'
  return {
    get: (params?: OptionParams) =>
      metaletV3Request<T>(`${metaletHost}${path}`, { method: 'GET', params, withCredential: true }),
    post: (data?: OptionData) =>
      metaletV3Request<T>(`${metaletHost}${path}`, { method: 'POST', data, withCredential: true }),
  }
}

export const ordinalsApi = (path: string) => {
  const url = path.includes(ORDINALS_HOST) ? path : `${ORDINALS_HOST}${path}`
  return {
    get: (params?: OptionParams) => request(url, { method: 'GET', params }),
    post: (data?: OptionData) => request(url, { method: 'POST', data }),
  }
}

export const mempoolApi = <T>(path: string) => {
  const mempoolHost = MEMPOOL_HOST + '/api'
  return {
    get: (params?: OptionParams) => request<T>(`${mempoolHost}${path}`, { method: 'GET', params }),
    post: (data?: OptionData | string, headers?: Headers) =>
      request(`${mempoolHost}${path}`, { method: 'POST', headers, data }),
  }
}

enum API_STATUS {
  FAILED = '0',
  SUCCESS = '1',
}

interface UnisatResult<T> {
  status: API_STATUS
  message: string
  data: T
}

const unisatRequest = <T>(url: string, options: RequestOption): Promise<T> =>
  request<UnisatResult<T>>(url, options).then((data) => {
    if (data.status === API_STATUS.FAILED) {
      throw new Error(data.message)
    }
    return data.data
  })

export const unisatApi = <T>(path: string) => {
  const unisatHost = network.value === 'mainnet' ? UNISAT_HOST : UNISAT_TESTNET_HOST

  const headers = new Headers()
  headers.append('X-Client', 'UniSat Wallet')
  headers.append('Content-Type', 'application/json;charset=utf-8')

  return {
    get: (params?: any) => unisatRequest<T>(`${unisatHost}${path}`, { method: 'GET', headers, params, mode: 'cors' }),
    post: (data?: any) => unisatRequest<T>(`${unisatHost}${path}`, { method: 'POST', headers, data, mode: 'cors' }),
  }
}

export const ordersApi = <T>(path: string) => {
  const ordersHost = network.value === 'mainnet' ? API2_ORDERS_EXCHANGE : API2_ORDERS_EXCHANGE_TESTNET
  return {
    get: (params?: OptionParams) => request<T>(`${ordersHost}${path}`, { method: 'GET', params }),
    post: (data?: OptionData) => request<T>(`${ordersHost}${path}`, { method: 'POST', data }),
  }
}

export default request
