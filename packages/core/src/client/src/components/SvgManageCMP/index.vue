<script setup>
import { ref, computed, watch } from 'vue'
import { VueInput, VueDrawer, VueCodeBlock, VueButton, VueIcon, VueDialog, showVueNotification } from '@vue/devtools-ui'
import { createHotContext } from 'vite-hot-client'
import { classifyByDirectory, readFilesAsArrayBuffer } from 'UTIL'
import { useClipboard } from '@vueuse/core'
import DropWrap from '../DropWrap/index.vue'
import DropDown from '../Dropdown/index.vue'
import DropTextArea from '../DropTextArea/index.vue'

const svglist = ref([])

const hot = await createHotContext('/___', `${location.pathname.split('/__svg-manage')[0] || ''}/`.replace(/\/\//g, '/'))
if (hot) {
  hot.on('vite-plugin-svg-manage:initData', ({ assetsSvgs }) => {
    if (assetsSvgs) {
      svglist.value = assetsSvgs
    }
  })
}


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
watch(showDetail, () => {
  if (!showDetail.value) {
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
    showVueNotification({
      type: 'warning',
      message: 'Cannot Copy. Please update your browser.'
    })
    return
  } else {
    copy(currentDetail.value.importee[currentImportTab.value])
    showVueNotification({
      type: 'success',
      message: 'Copied.'
    })
  }
}

const onDropFile = async ({ files, targetPath }) => {
  const filesList = await readFilesAsArrayBuffer(files)
  const data = { targetPath, filesList }
  hot.send('vite-plugin-svg-manage:saveFile', data)
}

const deleteAsset = (asset) => {
  const { publicPath: targetPath } = asset

  hot.send('vite-plugin-svg-manage:deleteFile', { targetPath })
  hot.on('vite-plugin-svg-manage:afterDeleteFile', ({ msg, err }) => {
    if (err) {
      showVueNotification({
        type: 'error',
        message: msg + ':    ' + JSON.stringify(err)
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

const dirList = computed(() => {
  return classifyByDirectory(svglist.value).map(item => ({ label: item.title, value: item.title }))
})
watch(showCreateDialogVisable, () => {
  if (!showCreateDialogVisable.value) {
    selectedValue.value = ''
  }
})
const dialogDropFile = (files) => {
  if (files.length === 0) {
    form.value.files = []
    form.value.name = ''
  } else {
    form.value.files = files
    form.value.name = files[0].name.slice(0, files[0].name.length - 4)
  }
}

const createSvgFile = async () => {
  let data = {
    targetPath: form.value.dir,
    filename: form.value.name + '.svg',
    content: form.value.content,
  }
  if (form.value.files.length !== 0) {
    data = {
      targetPath: form.value.dir,
      filesList: form.value.files
    }
  }
  hot.send('vite-plugin-svg-manage:saveFile', data)
  hot.on('vite-plugin-svg-manage:afterSaveFile', ({ msg, err }) => {
    if (!err) {
      showVueNotification({
        type: 'success',
        message: msg
      })
      showCreateDialogVisable.value = false
    } else {
      showVueNotification({
        type: 'error',
        message: msg + ':    ' + JSON.stringify(err)
      })
    }
  })
}

</script>

<template>
  <VueDrawer v-model="showDetail" contentClass="w-1/3">
    <div class="mt-8 px-4 py-2 flex items-center flex-col gap-8">
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
            :class="{ 'bg-slate-100 border-b-0': currentImportTab === tab.key }" v-for="tab in importTab" :key="tab.key"
            @click="() => toggleImportTab(tab.key)">
            {{ tab.title }}
          </div>
        </div>
        <div class="w-full mt-4 py-4 overflow-auto scrollbar">
          <VueCodeBlock :lines="false" :code="currentDetail.importee[currentImportTab]" lang="js" />
        </div>
        <VueButton class="mt-4" @click="copyCode">Copy</VueButton>
      </div>
    </div>
  </VueDrawer>
  <div class="w-full">
    <div class="w-3/5 mx-auto">
      <VueInput placeholder="Search..." v-model="searchInput" />
    </div>
    <div class="w-full mt-5 py-2 px-4 border-b border-gray-200 flex justify-between">
      <div class="text-gray-400 text-lg">
        {{ svglist.length }} {{ svglist.length === 1 ? 'asset' : 'assets' }} in total
      </div>
      <div class="flex items-center gap-2">
        <VueButton class="w-fit" type="primary" @click="() => showCreateDialogVisable = true">
          <VueIcon icon="i-carbon-add w-5 h-5"></VueIcon>
        </VueButton>
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
            <div class="flex flex-col justify-center items-center gap-3 cursor-pointer" v-for="asset in list"
              :key="asset.publicPath" @click="() => openDetail(asset)">
              <div
                class="group flex justify-center items-center rounded w-16 h-16 bg-neutral-50 border border-neutral-200">
                <img :src="asset.publicPath" class="w-9/12 group-hover:scale-125 transition-all duration-200">
              </div>
              <div class="text-neutral-500">
                {{ asset.publicPath.substring(asset.publicPath.lastIndexOf('/') + 1) }}
              </div>
              <VueIcon icon="i-carbon-trash-can" class="w-5 h-5 cursor-pointer transition-colors text-red-500"
                @click.stop="() => deleteAsset(asset)"></VueIcon>
            </div>
          </div>
        </div>
      </DropWrap>
    </div>
  </div>
  <VueDialog height="fit-content" v-model="showCreateDialogVisable" title="Upload/Create Svg">
    <template #default>
      <div class="flex flex-col gap-2 mt-4">
        <div>
          <p>Icon Name:</p>
          <p class="text-sm text-gray-400">You don't need to input .svg</p>
        </div>
        <VueInput placeholder="Input..." v-model="form.name"></VueInput>
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
    </template>
    <template #footer>
      <div class="w-full flex items-center justify-end gap-2">
        <VueButton class="w-fit" @click="() => showCreateDialogVisable = false">
          Close
        </VueButton>
        <VueButton class="w-fit" type="primary" @click="createSvgFile">
          Create
        </VueButton>
      </div>
    </template>
  </VueDialog>
</template>

<style scoped>
.scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 8px;
}

.scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(128, 128, 128, .1);
  border-radius: 4px;
}

.scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
</style>
