import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import process from 'node:process'
import sirv from 'sirv'
import svgson from 'svgson'
import { bold, dim, green, cyan } from 'kolorist'
import { normalizePath } from 'vite'
import type { PluginOption, ResolvedConfig } from 'vite'
import { getAssetsSvg, compareSvg } from './assets'
import { parseSvgsonData } from './utils/assets'
import { SVGManageOptions, SvgFileInfosOpions } from './types'
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
      const filesList = await getAssetsSvg(resolvedConfig.resolve.alias, resolvedConfig.root)
      assetsSvgs = filesList
      config = resolvedConfig
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

      server.ws.on('vite-plugin-svg-manage:saveFile', (data) => {
        const { filesList, targetPath, filename, content } = data
        if (!!content) {
          const dir = path.join(config.root, targetPath)
          const target = path.join(dir, filename)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
          }
          fs.writeFile(target, content, async err => {
            if (!err) {
              const result = await getAssetsSvg(config.resolve.alias, config.root)
              assetsSvgs = result
              server.ws.send('vite-plugin-svg-manage:initData', { assetsSvgs: result })
              server.ws.send('vite-plugin-svg-manage:afterSaveFile', { msg: 'Success' })
            } else {
              server.ws.send('vite-plugin-svg-manage:afterSaveFile', { msg: 'Failed to upload', err })
            }
          })
        } else {
          filesList.forEach(file => {
            const base64Prefix = 'data:image/svg+xml;base64,';
            if (file.content.startsWith(base64Prefix)) {
              file.content = file.content.slice(base64Prefix.length);
            }
            const buffer = Buffer.from(file.content, 'base64');
            const target = path.join(config.root, targetPath, file.name)

            fs.writeFile(target, buffer, async (err) => {
              if (!err) {
                const result = await getAssetsSvg(config.resolve.alias, config.root)
                assetsSvgs = result
                server.ws.send('vite-plugin-svg-manage:initData', { assetsSvgs: result })
                server.ws.send('vite-plugin-svg-manage:afterSaveFile', { msg: 'Success' })
              } else {
                server.ws.send('vite-plugin-svg-manage:afterSaveFile', { msg: 'Failed to upload', err })
              }
            })
          })
        }

      })

      server.ws.on('vite-plugin-svg-manage:deleteFile', (data) => {
        const { targetPath } = data
        const target = path.join(config.root, targetPath)
        fs.unlink(target, async (err) => {
          if (!err) {
            const result = await getAssetsSvg(config.resolve.alias, config.root)
            assetsSvgs = result
            server.ws.send('vite-plugin-svg-manage:initData', { assetsSvgs: result })
          } else {
            server.ws.send('vite-plugin-svg-manage:afterDeleteFile', { msg: 'Failed to delete', err })
          }
        });
      })

      server.ws.on('vite-plugin-svg-manage:renameFile', (data) => {
        const { newName, targetPath, oldPath } = data
        const target = path.join(config.root, targetPath, newName)
        const normalOldPath = path.join(config.root, oldPath)
        fs.rename(normalOldPath, target, async (err) => {
          if (!err) {
            const result = await getAssetsSvg(config.resolve.alias, config.root)
            assetsSvgs = result
            server.ws.send('vite-plugin-svg-manage:initData', { assetsSvgs: result })
          } else {
            server.ws.send('vite-plugin-svg-manage:afterRenameFile', { msg: 'Failed to delete', err })
          }
        })
      })

      server.ws.on('vite-plugin-svg-manage:compareFile', (data) => {
        const { filesList, targetPath, filename, content } = data
        if (!!content) {
          const uploadSvgson = svgson.parseSync(content)
          const uploadSvgsonData = parseSvgsonData(uploadSvgson)
          const result = compareSvg(uploadSvgsonData, assetsSvgs)
          if (!!result) {
            server.ws.send('vite-plugin-svg-manage:compareCallback', { msg: 'Find Same Svg', result: [result] })
          } else {
            server.ws.send('vite-plugin-svg-manage:compareCallback', { msg: '', result: [result] })
          }
        } else {
          const result = []
          filesList.forEach(file => {
            const base64Prefix = 'data:image/svg+xml;base64,';
            if (file.content.startsWith(base64Prefix)) {
              const content = (Buffer.from(file.content.slice(base64Prefix.length), 'base64')).toString('utf-8')
              const uploadSvgson = svgson.parseSync(content)
              const uploadSvgsonData = parseSvgsonData(uploadSvgson)
              const res = compareSvg(uploadSvgsonData, assetsSvgs)
              if(!!res) {
                result.push(res)
              }
            }
          })
          server.ws.send('vite-plugin-svg-manage:compareCallback', { msg: '', result })
        }
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
    }
  }
}
export default VitePluginSvgManage
