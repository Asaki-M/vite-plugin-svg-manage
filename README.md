# vite-plugin-svg-manage

[![NPM version](https://img.shields.io/npm/v/vite-plugin-svg-manage?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-svg-manage)

Easy to manage assets of svg to your vite project.

## Why?
When multi-person development uses svg as an icon, we often encounter that the svg created by others has been placed in the project's assets but is not displayed in the project and the name is not well-known. We generate this svg again, resulting in the repeated creation of the same content.

To solve this problem I created the vite-plugin-manage-svg to improve this situation.

## Install

```
npm i -D vite-plugin-svg-manage
```

In your `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import VitePluginSvgManage from 'vite-plugin-svg-manage'

export default defineConfig({
  plugins: [
    VitePluginSvgManage()
  ],
})
```

## Introduce

You can drop file(s) in the assets directory to create svg icon.

![](/docs/img/overview.png)

Also, you can copy svg content to create a dialog. The dialog supports to creation of a new directory for SVG content.

![](/docs/img/create.png)

Click the SVG can view details and copy this SVG importee code. If you do not config assets alias, it only supports `<img src="..." />`

![](/docs/img/detail.png)

## TODO

✅️ add/delete svg

✅️ rename svg

✅️ compare svg content

☑️ iframe in app

☑️ optimization code

☑️ support nuxt