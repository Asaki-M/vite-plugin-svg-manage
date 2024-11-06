import { ViteDevServer, Alias } from "vite";

import path from 'node:path'
import fs from 'node:fs'
import svgson from 'svgson'
import { SvgFileInfosOpions } from "./types";
import { compareSvg, getAssetsSvg } from "./assets";
import { parseSvgsonData } from "./utils/assets";

const prefix = 'vite-plugin-svg-manage:'

export class VitePluginSvgManageContext {
  private static instance: VitePluginSvgManageContext | null = null;
  private server: ViteDevServer;
  private root: string;
  private alias: Array<Alias>
  public assetsSvgs: Array<SvgFileInfosOpions>

  constructor(server: ViteDevServer) {
    if (VitePluginSvgManageContext.instance) {
      return VitePluginSvgManageContext.instance;
    }

    this.server = server;
    VitePluginSvgManageContext.instance = this;
  }

  public async init(alias: Array<Alias>, root: string) {
    this.root = root
    this.alias = alias
    await this.getSvgList(alias, root);
  }

  private async getSvgList(alias: Array<Alias>, root: string) {
    const filesList = await getAssetsSvg(alias, root)
    this.assetsSvgs = filesList
  }

  public sendData() {
    this.server.ws.send(prefix + 'initData', { assetsSvgs: this.assetsSvgs })
  }

  public sendCallback(data: Object) {
    this.server.ws.send(prefix + 'callback', data)
  }

  public watchRename() {
    const root = this.root
    const alias = this.alias
    this.server.ws.on(prefix + 'renameFile', (data) => {
      const { newName, targetPath, oldPath } = data
      const target = path.join(root, targetPath, newName)
      const normalOldPath = path.join(root, oldPath)
      fs.rename(normalOldPath, target, async (err) => {
        if (!err) {
          await this.getSvgList(alias, root)
          this.sendData()
        } else {
          this.sendCallback({ msg: 'Failed to rename', err })
        }
      })
    })
  }

  public watchDelete() {
    const root = this.root
    const alias = this.alias
    this.server.ws.on(prefix + 'deleteFile', (data) => {
      const { targetPath } = data
      const target = path.join(root, targetPath)
      fs.unlink(target, async (err) => {
        if (!err) {
          await this.getSvgList(alias, root)
          this.sendData()
        } else {
          this.sendCallback({ msg: 'Failed to delete', err })
        }
      });
    })
  }

  public sendCompareCallback(data: Object) {
    this.server.ws.send(prefix + 'compareCallback', data)
  }

  public watchCompare() {
    this.server.ws.on(prefix + 'compareFile', (data) => {
      const { filesList, content } = data
      if (!!content) {
        const uploadSvgson = svgson.parseSync(content)
        const uploadSvgsonData = parseSvgsonData(uploadSvgson)
        const result = compareSvg(uploadSvgsonData, this.assetsSvgs)
        if (!!result) {
          this.sendCompareCallback({ msg: 'Find Same Svg', result: [result] })
        } else {
          this.sendCompareCallback({ msg: '', result: [result] })
        }
      } else {
        const result = []
        filesList.forEach(file => {
          const base64Prefix = 'data:image/svg+xml;base64,';
          if (file.content.startsWith(base64Prefix)) {
            const content = (Buffer.from(file.content.slice(base64Prefix.length), 'base64')).toString('utf-8')
            const uploadSvgson = svgson.parseSync(content)
            const uploadSvgsonData = parseSvgsonData(uploadSvgson)
            const res = compareSvg(uploadSvgsonData, this.assetsSvgs)

            if (!!res) {
              result.push(res)
            }
          }
        })
        this.sendCompareCallback({ msg: '', result })
      }
    })
  }

  public watchSave() {
    const root = this.root
    const alias = this.alias
    this.server.ws.on(prefix + 'saveFile', (data) => {
      const { filesList, targetPath, filename, content } = data
      if (!!content) {
        const dir = path.join(root, targetPath)
        const target = path.join(dir, filename)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir)
        }
        fs.writeFile(target, content, async err => {
          if (!err) {
            await this.getSvgList(alias, root)
            this.sendData()
            this.sendCallback({ msg: 'Success' })
          } else {
            this.sendCallback({ msg: 'Failed to upload', err })
          }
        })
      } else {
        filesList.forEach(file => {
          const base64Prefix = 'data:image/svg+xml;base64,';
          if (file.content.startsWith(base64Prefix)) {
            file.content = file.content.slice(base64Prefix.length);
          }
          const buffer = Buffer.from(file.content, 'base64');
          const target = path.join(root, targetPath, file.name)
          
          const dir = path.join(root, targetPath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
          }

          fs.writeFile(target, buffer, async (err) => {
            if (!err) {
              await this.getSvgList(alias, root)
              this.sendData()
              this.sendCallback({ msg: 'Success' })
            } else {
              this.sendCallback({ msg: 'Failed to upload', err })
            }
          })
        })
      }

    })
  }
}