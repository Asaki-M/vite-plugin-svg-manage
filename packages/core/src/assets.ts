import { Alias } from "vite"

import { normarlizeAlias, formatFilesInfo } from "./utils/assets"

export async function getAssetsSvg(alias: Array<Alias>, root: string) {
  const normalizeAlias = normarlizeAlias(alias, root)
  const filesList = await formatFilesInfo(root, normalizeAlias)

  return filesList
}