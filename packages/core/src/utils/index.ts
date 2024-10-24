import fg from 'fast-glob'
import path from 'node:path'
import fs from 'node:fs'
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


export async function formatFilesInfo(dir: string, aliasOptions: SvgFileAliasOptions): Promise<SvgFileInfosOpions[]> {
  const svgDir = path.join(dir, '/src/assets');
  const svgFiles = await fg('**/*.svg', { cwd: svgDir });
  const filesInfo = svgFiles.map(item => {
    const filePath = normalizePath(path.join(svgDir, item));
    // file size
    const stats = fs.statSync(filePath);
    const fileSize = computedFileSize(stats.size);
    // width x height
    const content = fs.readFileSync(filePath, 'utf-8');
    const widthMatch = content.match(/width=["']?(\d+)(?:px)?["']?/i);
    const heightMatch = content.match(/height=["']?(\d+)(?:px)?["']?/i);
    const width = widthMatch ? parseInt(widthMatch[1], 10) : null;
    const height = heightMatch ? parseInt(heightMatch[1], 10) : null;
    // import type
    const basename = camelCaseName(path.basename(item, '.svg'))
    let importee: SvgFileImporteeOptions = {
      imgCode: `<img src="__temp__" />`,
      urlCode: `import ${basename}Url from '__temp__'`,
      cmpCode: `import ${basename.charAt(0).toUpperCase() + basename.slice(1)}Icon from '__temp__`,
      rawCode: `import ${basename}Raw from '__temp__?raw'`,
    }
    const replaceTempInImportee = (importPath: string) => {
      ['imgCode', 'urlCode', 'cmpCode', 'rawCode'].forEach((key) => {
        importee[key] = importee[key].replace('__temp__', importPath);
      });
    };
    if (aliasOptions.isAssets) {
      const importPath = normalizePath(path.join(aliasOptions.alias, item))
      replaceTempInImportee(importPath);
    } else if (aliasOptions.isSrc) {
      const importPath = normalizePath(path.join(aliasOptions.alias, 'assets/', item))
      replaceTempInImportee(importPath);
    } else {
      importee = {
        imgCode: `<img src="/src/assets/${item}" />`
      }
    }

    return {
      publicPath: `/src/assets/${item}`,
      filePath,
      fileSize,
      width,
      height,
      importee
    };
  })
  return filesInfo
}