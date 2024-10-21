/* eslint-disable new-cap */

import * as Vue from 'vue'
import App from 'virtual:svg-manage-path:Overlay.vue'
import svgManageOptions from 'virtual:svg-manage-options'
const CONTAINER_ID = 'svg-manage-container'

function createSVGManageContainer() {
  if (document.getElementById(CONTAINER_ID) != null)
    throw new Error('svgManageContainer element already exists')

  const el = document.createElement('div')
  el.setAttribute('id', CONTAINER_ID)
  document.getElementsByTagName('body')[0].appendChild(el)
  return el
}

function load() {
  const isClient = typeof window !== 'undefined'
  if (!isClient)
    return
  createSVGManageContainer()
  const { vue } = svgManageOptions
  // vue 2/3 compatibility
  vue === 3
    ? Vue.createApp({
      render: () => Vue.h(App),
      devtools: {
        hide: true,
      },
    }).mount(`#${CONTAINER_ID}`)
    : new Vue.default({
      render: h => h(App),
      devtools: {
        hide: true,
      },
    }).$mount(`#${CONTAINER_ID}`)
}

load()
