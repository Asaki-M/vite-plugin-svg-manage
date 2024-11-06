import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import sirv from 'sirv'
import { bold, dim, green, cyan } from 'kolorist'
import { normalizePath } from 'vite'
import type { PluginOption, ResolvedConfig } from 'vite'
import { SVGManageOptions } from './types'
import { DIR_CLIENT } from './dir'
import { VitePluginSvgManageContext } from './context'

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

function VitePluginSvgManage(options: SVGManageOptions): PluginOption {
  const svgManagePath = getSvgManagePath()
  const normalizedOptions = {
    ...options,
    toggleComboKey: defaultToggleComboKey
  }
  let config: ResolvedConfig

  return {
    name: 'vite-plugin-svg-manage',
    apply: 'serve',
    enforce: "pre",
    async configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    async configureServer(server) {
      const ctx = new VitePluginSvgManageContext(server)
      await ctx.init(config.resolve.alias, config.root)

      const base = (server.config.base) || '/'
      server.middlewares.use(`${base}__svg-manage`, sirv(DIR_CLIENT, {
        single: true,
        dev: true,
      }))

      server.ws.on('connection', () => {
        ctx.sendData()
      })

      ctx.watchRename()
      ctx.watchDelete()
      ctx.watchCompare()
      ctx.watchSave()
      

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
    }
  }
}
export default VitePluginSvgManage
