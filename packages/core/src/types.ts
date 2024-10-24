export interface SVGManageOptions {
  base?: string
  // toggleComboKey?: string | boolean
}

export interface SvgFileImporteeOptions {
  imgCode: string
  urlCode?: string
  cmpCode?: string
  rawCode?: string
}

export interface SvgFileInfosOpions {
  publicPath: string
  filePath: string
  fileSize: string
  width: number | null
  height: number | null
  importee: SvgFileImporteeOptions
}

export interface SvgFileAliasOptions {
  alias: string
  isRoot: boolean
  isSrc: boolean
  isAssets: boolean
}