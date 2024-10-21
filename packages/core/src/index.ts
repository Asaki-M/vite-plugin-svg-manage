import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import process from 'node:process'
import { bold, dim, green, yellow } from 'kolorist'
import { normalizePath } from 'vite'
import type { PluginOption, ResolvedConfig } from 'vite'
import { idToFile, parseVueRequest } from './utils'
import { SVGManageOptions } from './types'
import fg from 'fast-glob'

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

export function normalizeComboKeyPrint(toggleComboKey: string) {
  return toggleComboKey.split('-').map(key => toggleComboKeysMap[key] || key[0].toUpperCase() + key.slice(1)).join(dim('+'))
}

async function scanSvg(dir) {
  const svgDir = path.join(dir, '/src/assets');
  const svgFiles = await fg('**/*.svg', { cwd: svgDir });
  return svgFiles.map(item => `/src/assets/${item}`)
}

function VitePluginSvgManage(options: SVGManageOptions): PluginOption {
  const svgManagePath = getSvgManagePath()
  const normalizedOptions = {
    ...options,
    toggleComboKey: defaultToggleComboKey
  }
  let config: ResolvedConfig
  let assetsSvgs: Array<string>

  return {
    name: 'vite-plugin-svg-manage',
    enforce: 'pre',
    async configResolved(resolvedConfig) {
      const svglist = await scanSvg(resolvedConfig.root)
      config = resolvedConfig
      assetsSvgs = svglist
    },
    async resolveId(importee: string) {
      if (importee.startsWith('virtual:svg-manage-options')) {
        return importee
      }
      else if (importee.startsWith('virtual:svg-manage-path:')) {
        const resolved = importee.replace('virtual:svg-manage-path:', `${svgManagePath}/`)
        return resolved
      }
    },

    async load(id) {
      if (id === 'virtual:svg-manage-options') {
        return `export default ${JSON.stringify({ ...normalizedOptions, assetsSvgs })}`
      }
      else if (id.startsWith(svgManagePath)) {
        const { query } = parseVueRequest(id)
        if (query.type)
          return
        // read file ourselves to avoid getting shut out by vites fs.allow check
        const file = idToFile(id)
        if (fs.existsSync(file))
          return await fs.promises.readFile(file, 'utf-8')
        else
          console.error(`failed to find file for svg-manage: ${file}, referenced by id ${id}.`)
      }
    },
    configureServer(server) {
      const _printUrls = server.printUrls
      server.printUrls = () => {
        const keys = normalizeComboKeyPrint(defaultToggleComboKey)
        _printUrls()
        console.log(`  ${green('➜')}  ${bold('Svg Manage Plugin')}: ${green(`Press ${yellow(keys)} in App to open svg management`)}\n`)
      }
    },
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            injectTo: 'head',
            attrs: {
              type: 'module',
              src: `${config.base || '/'}@id/virtual:svg-manage-path:load.js`,
            },
          },
        ],
      }
    }
  }
}
export default VitePluginSvgManage
