import type { PluginOption, ResolvedConfig, Alias } from 'vite'
import { SvgFileImporteeOptions, SvgFileInfosOpions, SvgFileAliasOptions } from '../types'

import { normalizePath } from 'vite'
import fg from 'fast-glob'
import path from 'node:path'
import fs from 'node:fs'
import { computedFileSize, camelCaseName } from '.'

export function normarlizeAlias(alias: Array<Alias>, root: string): SvgFileAliasOptions {
  const result: SvgFileAliasOptions = {
    alias: '',
    isRoot: false,
    isSrc: false,
    isAssets: false
  }
  let srcPath = '', assetsPath = ''
  alias.forEach(item => {
    const normalizeAliasPath = normalizePath(item.replacement)
    if (normalizeAliasPath.lastIndexOf('/src/assets') !== -1) {
      assetsPath = item.find.toString()
    }
    if (normalizeAliasPath.lastIndexOf('/src') !== -1) {
      srcPath = item.find.toString()
    }
  })
  if (assetsPath) {
    result.alias = assetsPath
    result.isAssets = true
  } else if (srcPath) {
    result.alias = srcPath
    result.isSrc = true
  } else {
    result.alias = root
    result.isRoot = true
  }
  return result
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
