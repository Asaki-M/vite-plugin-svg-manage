<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { VueInput, VueDrawer, VueCodeBlock, VueButton, showVueNotification } from '@vue/devtools-ui'
import { createHotContext } from 'vite-hot-client'

const svglist = ref([])

const hot = await createHotContext('/___', `${location.pathname.split('/__svg-manage')[0] || ''}/`.replace(/\/\//g, '/'))
if (hot) {
  hot.on('vite-plugin-svg-manage:initData', ({ assetsSvgs }) => {
    if (assetsSvgs) {
      svglist.value = assetsSvgs

    }
  })
}

// const showSvgManage = ref(false)
// function onKeydown(event) {
//   if (event.repeat || event.key === undefined)
//     return
//   if (event.code === 'KeyA' && event.altKey && event.shiftKey) {
//     showSvgManage.value = true
//   } else if (event.key === 'Escape') {
//     showSvgManage.value = false
//   }
// }

// onUnmounted(() => {
//   document.body.removeEventListener('keydown', onKeydown)
// })


function classifyByDirectory(filesInfo) {
  const directoryMap = {};

  filesInfo.forEach(file => {
    const directory = file.publicPath.substring(0, file.publicPath.lastIndexOf('/'));
    if (!directoryMap[directory]) {
      directoryMap[directory] = [];
    }
    directoryMap[directory].push(file);
  });

  return Object.keys(directoryMap).map(directory => ({
    title: directory,
    list: directoryMap[directory]
  }));
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

const copyCode = () => {
  const text = currentDetail.value.importee[currentImportTab.value]
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showVueNotification({
        type: 'success',
        message: 'Copied.'
      })
    }).catch(err => {
      showVueNotification({
        type: 'error',
        message: 'Copied Failed.'
      })
    });
  } else {
    showVueNotification({
      type: 'warning',
      message: 'Cannot Copy. Please update your browser.'
    })
  }
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
    <h2 class="w-full mt-5 py-2 px-4 border-b border-gray-200 text-gray-400">
      {{ svglist.length }} {{ svglist.length === 1 ? 'asset' : 'assets' }} in total
    </h2>
  </div>
  <div class="w-full py-4">
    <div class="w-full border-b border-gray-200 py-4 px-2" v-for="({ title, list }, index) in computedList"
      :key="index">
      <div class="font-bold mb-4">{{ title }}</div>
      <div class="w-full flex-wrap flex gap-5">
        <div class="flex flex-col justify-center items-center gap-3 cursor-pointer" v-for="asset in list"
          :key="asset.publicPath" @click="() => openDetail(asset)">
          <div class="group flex justify-center items-center rounded w-16 h-16 bg-neutral-50 border border-neutral-200">
            <img :src="asset.publicPath" class="w-9/12 group-hover:scale-125 transition-all duration-200">
          </div>
          <div class="text-neutral-500">{{ asset.publicPath.substring(asset.publicPath.lastIndexOf('/') + 1) }}
          </div>
        </div>
      </div>
    </div>
  </div>
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
