<script setup>
import { ref, computed, watch } from 'vue'
import { NInput, NButton, NDialog, useNotification, NDrawer, NDrawerContent, NIcon, NModal } from 'naive-ui'
import { createHotContext } from 'vite-hot-client'
import { classifyByDirectory, readFilesAsArrayBuffer } from 'UTIL'
import { useClipboard } from '@vueuse/core'
import DropWrap from '../DropWrap/index.vue'
import DropDown from '../Dropdown/index.vue'
import DropTextArea from '../DropTextArea/index.vue'
import LabelWithInput from '../LabelWithInput/index.vue'
import SameSVGDialog from '../SameSVGDialog/index.vue'

const svglist = ref([])

const hot = await createHotContext('/___', `${location.pathname.split('/__svg-manage')[0] || ''}/`.replace(/\/\//g, '/'))
if (hot) {
  hot.on('vite-plugin-svg-manage:initData', ({ assetsSvgs }) => {
    if (assetsSvgs) {
      svglist.value = assetsSvgs
      console.log(assetsSvgs)
    }
  })
}

const message = useNotification()

const searchInput = ref('')
const computedList = computed(() => {
  if (searchInput.value) {
    return classifyByDirectory(svglist.value.filter(item => item.publicPath.includes(searchInput.value)))
  }
  return classifyByDirectory(svglist.value)
})

const showDetail = ref(false)
const currentDetail = ref(null)
const importTab = computed(() => {
  if (currentDetail.value) {
    const importeeKeyMapTitle = {
      imgCode: 'Use img url',
      urlCode: 'Import by url',
      cmpCode: 'Import as component',
      rawCode: 'Import by raw'
    }
    return Object.entries(currentDetail.value.importee).map(([key, value]) => ({
      title: importeeKeyMapTitle[key],
      key: key,
    }));
  } else {
    return []
  }
})

const openDetail = (detail) => {
  showDetail.value = true
  currentDetail.value = detail
}
watch(showDetail, (newVal) => {
  if (!newVal) {
    currentDetail.value = null
    currentImportTab.value = 'imgCode'
  }
})

const currentImportTab = ref('imgCode')
const toggleImportTab = (value) => {
  currentImportTab.value = value
}

const { copy, isSupported } = useClipboard()
const copyCode = () => {
  if (!isSupported) {
    message.warning({
      content: 'Cannot Copy. Please update your browser.',
      duration: 2000
    })
    return
  } else {
    copy(currentDetail.value.importee[currentImportTab.value])
    message.success({
      content: 'Copied.',
      duration: 2000
    })
  }
}

const computedFilename = computed(() => {
  return svglist.value.map(item => {
    const list = item.publicPath.split('/')
    return list[list.length - 1]
  })
})
const checkIsSameName = (data) => {
  if (Array.isArray(data)) {
    for (let item of data) {
      if (computedFilename.value.indexOf(item.name) !== -1) {
        message.warning({
          content: 'Cannot upload the same name svg.',
          duration: 2000
        })
        return true
      }
    }
  } else if (typeof data === 'string') {
    if (computedFilename.value.indexOf(data) !== -1) {
      message.warning({
        content: 'Cannot create the same name svg.',
        duration: 2000
      })
      return true
    }
  }
  return false
}

const onDropFile = async ({ files, targetPath }) => {
  if (checkIsSameName(files)) return

  const filesList = await readFilesAsArrayBuffer(files)
  const data = { targetPath, filesList }
  hot.send('vite-plugin-svg-manage:compareFile', data)
  hot.on('vite-plugin-svg-manage:compareCallback', ({ msg, result }) => {
    if (!!result && result.length > 0) {
      showSameSvgTip.value = true
      currentSameSvg.value = result || []
    } else {
      hot.send('vite-plugin-svg-manage:saveFile', data)
    }
  })
}

const deleteAsset = (asset) => {
  const { publicPath: targetPath } = asset

  hot.send('vite-plugin-svg-manage:deleteFile', { targetPath })
  hot.on('vite-plugin-svg-manage:callback', ({ msg, err }) => {
    if (err) {
      message.error({
        content: msg + ':    ' + JSON.stringify(err),
        duration: 2000
      })
    }
  })
}

const showCreateDialogVisable = ref(false)
const form = ref({
  dir: '',
  name: '',
  content: '',
  files: []
})
const selectedValue = ref('')
const showSameSvgTip = ref(false)
const currentSameSvg = ref([])

const dirList = computed(() => {
  return classifyByDirectory(svglist.value).map(item => ({ label: item.title, value: item.title }))
})
watch(showCreateDialogVisable, (newVal) => {
  if (!newVal) {
    form.value = {
      dir: '',
      name: '',
      content: '',
      files: []
    }
    selectedValue.value = ''
  }
})
const dialogDropFile = (files) => {
  if (files.length === 0) {
    form.value.files = []
    form.value.name = ''
  } else {
    form.value.content = ''
    form.value.files = files
    form.value.name = files[0].name.slice(0, files[0].name.length - 4)
  }
}

const createSvgFile = async () => {
  let data

  if (form.value.files.length !== 0) {
    data = {
      targetPath: form.value.dir,
      filesList: form.value.files
    }
    if (checkIsSameName(form.value.files)) return
  } else if (form.value.content) {
    data = {
      targetPath: form.value.dir,
      filename: form.value.name + '.svg',
      content: form.value.content,
    }
    if (checkIsSameName(form.value.name + '.svg')) return
  }

  hot.send('vite-plugin-svg-manage:compareFile', data)
  hot.on('vite-plugin-svg-manage:compareCallback', ({ msg, result }) => {
    if (!!result && result.length > 0) {
      currentSameSvg.value = result
      showSameSvgTip.value = true
    } else {
      hot.send('vite-plugin-svg-manage:saveFile', data)
    }
  })

  hot.on('vite-plugin-svg-manage:callback', ({ msg, err }) => {
    if (!err) {
      message.success({
        content: msg,
        duration: 2000
      })
      showCreateDialogVisable.value = false
    } else {
      message.error({
        content: msg + ':    ' + JSON.stringify(err),
        duration: 2000
      })
    }
  })
}

const renameSvgFile = (name, publicPath) => {
  const arr = publicPath.split('/')
  arr.pop()
  const targetPath = arr.join('/')
  hot.send('vite-plugin-svg-manage:renameFile', { newName: name + '.svg', targetPath, oldPath: publicPath })
  hot.on('vite-plugin-svg-manage:callback', ({ msg, err }) => {
    if (err) {
      console.log(msg, err)
      message.error({
        content: msg + ':    ' + JSON.stringify(err),
        duration: 2000
      })
    }
  })
}

</script>

<template>
  <NDrawer v-model:show="showDetail" :width="500" class="scrollbar" :mask-closable="true">
    <NDrawerContent title="SVG Detail" closable>
      <div v-if="currentDetail" class="mt-4 px-4 py-2 flex items-center flex-col gap-8">
        <div class="flex justify-center items-center rounded w-16 h-16 bg-neutral-50 border border-neutral-200">
          <img :src="currentDetail.publicPath" class="w-9/12">
        </div>
        <div class="w-full flex flex-col gap-3">
          <div class="w-full flex">
            <div class="w-2/5 text-gray-400">Filepath</div>
            <div class="w-3/5 break-words">{{ currentDetail.filePath }}</div>
          </div>
          <div class="w-full flex">
            <div class="w-2/5 text-gray-400">Public Path</div>
            <div class="w-3/5 break-words">{{ currentDetail.publicPath }}</div>
          </div>
          <div class="w-full flex">
            <div class="w-2/5 text-gray-400">Image Size</div>
            <div class="w-3/5 break-words">{{ `${currentDetail.width} x ${currentDetail.height}` }}</div>
          </div>
          <div class="w-full flex">
            <div class="w-2/5 text-gray-400">File size</div>
            <div class="w-3/5 break-words">{{ currentDetail.fileSize }}</div>
          </div>
        </div>
        <div class="w-full">
          <div class="py-2 font-bold border-b border-gray-200">Import Type(click to copy)</div>
          <div class="w-full flex">
            <div
              class="text-sm w-fit px-4 py-2 hover:bg-slate-50 active:bg-slate-100 cursor-pointer border-r border-b border-gray-200"
              :class="{ 'bg-slate-100 border-b-0': currentImportTab === tab.key }" v-for="tab in importTab"
              :key="tab.key" @click="() => toggleImportTab(tab.key)">
              {{ tab.title }}
            </div>
          </div>
          <div class="w-full mt-4 py-4 overflow-auto scrollbar">
            <pre class="rounded bg-gray-50 p-4 overflow-auto">{{ currentDetail.importee[currentImportTab] }}</pre>
          </div>
          <NButton class="mt-4" @click="copyCode">Copy</NButton>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
  <div class="w-full">
    <div class="w-3/5 mx-auto">
      <NInput placeholder="Search..." v-model:value="searchInput" />
    </div>
    <div class="w-full mt-5 py-2 px-4 border-b border-gray-200 flex justify-between">
      <div class="text-gray-400 text-lg">
        {{ svglist.length }} {{ svglist.length === 1 ? 'asset' : 'assets' }} in total
      </div>
      <div class="flex items-center gap-2">
        <NButton class="w-fit" type="primary" @click="() => showCreateDialogVisable = true">
          <NIcon>
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32">
              <path fill="currentColor" d="M17 15V8h-2v7H8v2h7v7h2v-7h7v-2z" />
            </svg>
          </NIcon>
        </NButton>
      </div>
    </div>
  </div>
  <div class="w-full">
    <div class="w-full" v-for="({ title, list }, index) in computedList" :key="index">
      <DropWrap :targetPath="title" :dropDataTypes="['image/svg+xml']" @onDrop="onDropFile" v-slot="slotProps">
        <div class="w-full border-b border-gray-200 py-4 px-2 overflow-y-auto"
          :class="{ 'bg-stone-300/30': slotProps.isOverDropZone }">
          <div class="font-bold mb-4">{{ title }}</div>
          <div class="w-full flex-wrap flex gap-5">
            <div class="flex flex-col justify-center items-center gap-3" v-for="asset in list" :key="asset.publicPath">
              <div @click="() => openDetail(asset)"
                class="group flex justify-center items-center rounded w-16 h-16 bg-neutral-50 border border-neutral-200 cursor-pointer">
                <img :src="asset.publicPath" class="w-9/12 group-hover:scale-125 transition-all duration-200">
              </div>
              <LabelWithInput :label="asset.publicPath.substring(asset.publicPath.lastIndexOf('/') + 1)"
                @submit="(name) => renameSvgFile(name, asset.publicPath)"></LabelWithInput>
              <NIcon size="20" class="cursor-pointer text-red-500" @click.stop="() => deleteAsset(asset)">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32">
                  <path fill="currentColor" d="M12 12h2v12h-2zm6 0h2v12h-2z" />
                  <path fill="currentColor"
                    d="M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20zm4-26h8v2h-8z" />
                </svg>
              </NIcon>
            </div>
          </div>
        </div>
      </DropWrap>
    </div>
  </div>
  <NModal v-model:show="showCreateDialogVisable" style="width: 600px;" title="Upload/Create Svg" preset="card"
    :mask-closable="true">
    <div class="flex flex-col gap-2 mt-4">
      <div>
        <p>Icon Name:</p>
        <p class="text-sm text-gray-400">You don't need to input .svg</p>
      </div>
      <NInput placeholder="Input..." v-model:value="form.name"></NInput>
    </div>
    <div class="flex flex-col gap-2 mt-4">
      <div>
        <p>Dirctory: </p>
        <p class="text-sm text-gray-400">Support input a new dirctory</p>
      </div>
      <DropDown :options="dirList" v-model:selectedValue="form.dir"></DropDown>
    </div>
    <div class="flex flex-col gap-2 mt-4">
      <div>
        <p>Content:</p>
        <p class="text-sm text-gray-400">Input svg code or drop a svg file here</p>
      </div>
      <DropTextArea v-model:content="form.content" @dropFile="dialogDropFile"></DropTextArea>
    </div>
    <div class="flex items-center justify-end gap-2 mt-4">
      <NButton class="w-fit" @click="() => showCreateDialogVisable = false">
        Close
      </NButton>
      <NButton class="w-fit" type="primary" @click="createSvgFile">
        Create
      </NButton>
    </div>
  </NModal>
  <SameSVGDialog v-model:show="showSameSvgTip" :result="currentSameSvg" />
</template>
