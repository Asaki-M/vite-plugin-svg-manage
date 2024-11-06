import { Alias } from "vite"
import { SvgFileInfosOpions } from './types'
import { INode } from "svgson"

import { normarlizeAlias, formatFilesInfo } from "./utils/assets"
import { findDifferences } from "./utils"

export async function getAssetsSvg(alias: Array<Alias>, root: string) {
  const normalizeAlias = normarlizeAlias(alias, root)
  const filesList = await formatFilesInfo(root, normalizeAlias)

  return filesList
}

export function compareSvg(data: Array<INode>, list: Array<SvgFileInfosOpions>) {
  if(list.length === 0) return false

  let result = null
  for(let item of list) {
    if(data.length !== item.compareSvgData.length) continue

    for(let idx in data) {
      const dataNode = data[idx]
      const nodeItem = item.compareSvgData[idx]
      if(dataNode.name === nodeItem.name) {
        const diffAttributes = findDifferences(dataNode.attributes, nodeItem.attributes)
        if(Object.keys(diffAttributes).length === 0) {
          result = item
          break
        }
      }
    }
  }

  return result
}