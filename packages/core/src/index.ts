import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import process from 'node:process'
import sirv from 'sirv'
import { bold, dim, green, yellow, cyan } from 'kolorist'
import { normalizePath } from 'vite'
import type { PluginOption, ResolvedConfig, Alias } from 'vite'
import { idToFile, parseVueRequest, formatFilesInfo } from './utils'
import { SVGManageOptions, SvgFileInfosOpions, SvgFileAliasOptions } from './types'
import { DIR_CLIENT } from './dir'

const toggleComboKeysMap = {
  option: process.platform === 'darwin' ? 'Option(⌥)' : 'Alt(⌥)',
  meta: 'Command(⌘)',
  shift: 'Shift(⇧)',
}

const defaultToggleComboKey = 'option-shift-a'

function getSvgManagePath() {
  const pluginPath = normalizePath(path.dirname(fileURLToPath(import.meta.url)))
  return pluginPath.replace(/\/dist$/, '/src/client')
}

function normarlizeAlias(alias: Array<Alias>, root: string): SvgFileAliasOptions {
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

export function normalizeComboKeyPrint(toggleComboKey: string) {
  return toggleComboKey.split('-').map(key => toggleComboKeysMap[key] || key[0].toUpperCase() + key.slice(1)).join(dim('+'))
}

function VitePluginSvgManage(options: SVGManageOptions): PluginOption {
  const svgManagePath = getSvgManagePath()
  const normalizedOptions = {
    ...options,
    toggleComboKey: defaultToggleComboKey
  }
  let config: ResolvedConfig
  let assetsSvgs: Array<SvgFileInfosOpions>

  return {
    name: 'vite-plugin-svg-manage',
    apply: 'serve',
    enforce: "pre",
    async configResolved(resolvedConfig) {
      const alias = normarlizeAlias(resolvedConfig.resolve.alias, resolvedConfig.root)
      const filesList = await formatFilesInfo(resolvedConfig.root, alias)
      assetsSvgs = filesList
      config = resolvedConfig
    },
    async resolveId(importee: string) {
      if (importee.startsWith('virtual:svg-manage-options')) {
        return importee
      }
      // else if (importee.startsWith('virtual:svg-manage-path:')) {
      //   const resolved = importee.replace('virtual:svg-manage-path:', `${svgManagePath}/`)
      //   return resolved
      // }
    },

    async load(id) {
      if (id === 'virtual:svg-manage-options') {
        return `export default ${JSON.stringify({ ...normalizedOptions })}`
      }
      // else if (id.startsWith(svgManagePath)) {
      //   const { query } = parseVueRequest(id)
      //   if (query.type)
      //     return
      //   // read file ourselves to avoid getting shut out by vites fs.allow check
      //   const file = idToFile(id)
      //   if (fs.existsSync(file))
      //     return await fs.promises.readFile(file, 'utf-8')
      //   else
      //     console.error(`failed to find file for svg-manage: ${file}, referenced by id ${id}.`)
      // }
    },
    configureServer(server) {
      const base = (server.config.base) || '/'
      server.middlewares.use(`${base}__svg-manage`, sirv(DIR_CLIENT, {
        single: true,
        dev: true,
      }))

      server.ws.on('connection', () => {
        server.ws.send('vite-plugin-svg-manage:initData', { assetsSvgs })
      })

      const _printUrls = server.printUrls
      const colorUrl = (url: string) =>
        cyan(url.replace(/:(\d+)\//, (_, port) => `:${bold(port)}/`))

      server.printUrls = () => {
        const urls = server.resolvedUrls!
        _printUrls()

        for (const url of urls.local) {
          const devtoolsUrl = url.endsWith('/') ? `${url}__svg-manage/` : `${url}/__svg-manage__/`
          console.log(`  ${green('➜')}  ${bold('Svg manage')}: ${green(`Open ${colorUrl(`${devtoolsUrl}`)} as a separate window`)}`)
        }
      }

      // server.printUrls = () => {
      //   const keys = normalizeComboKeyPrint(defaultToggleComboKey)
      //   _printUrls()
      //   console.log(`  ${green('➜')}  ${bold('Svg Manage Plugin')}: ${green(`Press ${yellow(keys)} in App to open svg management`)}\n`)
      // }
    }
  }
}
export default VitePluginSvgManage
