
import { normalizePath } from 'vite'
import { SvgFileInfosOpions, SvgFileAliasOptions, SvgFileImporteeOptions } from '../types'

export interface VueQuery {
  vue?: boolean
  src?: boolean
  type?: 'script' | 'template' | 'style' | 'custom'
  index?: number
  lang?: string
  raw?: boolean
  from?: string
  isJsx?: boolean
}

export function parseVueRequest(id: string) {
  const [filename] = id.split('?', 2)
  const url = new URL(id, 'http://domain.inspector')
  const query = Object.fromEntries(url.searchParams.entries()) as VueQuery
  if (query.vue != null)
    query.vue = true

  if (query.src != null)
    query.src = true

  if (query.index != null)
    query.index = Number(query.index)

  if (query.raw != null)
    query.raw = true

  if (query.hasOwnProperty('lang.tsx') || query.hasOwnProperty('lang.jsx'))
    query.isJsx = true

  return {
    filename,
    query,
  }
}

const FS_PREFIX = '/@fs/'
const IS_WINDOWS = process.platform === 'win32'
const queryRE = /\?.*$/s
const hashRE = /#.*$/s

export function idToFile(id: string): string {
  // strip /@fs/ but keep leading / on non-windows
  if (id.startsWith(FS_PREFIX))
    id = id = id.slice(IS_WINDOWS ? FS_PREFIX.length : FS_PREFIX.length - 1)

  // strip query and hash
  return id.replace(hashRE, '').replace(queryRE, '')
}

export function computedFileSize(size: number): string {
  if (size < 1024)
    return `${size} B`
  if (size < 1024 * 1024)
    return `${(size / 1024).toFixed(2)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

export function camelCaseName(basename: string): string {
  return basename.toLowerCase().replace(/[-_\s]+(.)?/g, (match, chr) => chr ? chr.toUpperCase() : '')
}