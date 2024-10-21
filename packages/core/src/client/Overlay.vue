<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import svgManageOptions from 'virtual:svg-manage-options'

const showSvgManage = ref(false)
function onKeydown(event) {
  if (event.repeat || event.key === undefined)
    return
  if (event.code === 'KeyA' && event.altKey && event.shiftKey) {
    showSvgManage.value = true
  } else if (event.key === 'Escape') {
    showSvgManage.value = false
  }
}

onMounted(() => {
  document.body.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.body.removeEventListener('keydown', onKeydown)
})


function classifyByDirectory(paths) {
  const directoryMap = {};
  paths.forEach(path => {
    const directory = path.substring(0, path.lastIndexOf('/'));
    if (!directoryMap[directory]) {
      directoryMap[directory] = [];
    }
    directoryMap[directory].push(path);
  });

  return Object.keys(directoryMap).map(directory => ({
    title: directory,
    list: directoryMap[directory]
  }));
}

const assetsSvgs = ref(svgManageOptions.assetsSvgs)
const searchInput = ref('')
const computedList = computed(() => {
  if (searchInput.value) {
    return classifyByDirectory(assetsSvgs.value.filter(item => item.includes(searchInput.value)))
  }
  return classifyByDirectory(assetsSvgs.value)
})

const showDetail = ref(false)
const openDetail = (detailSrc) => {
  showDetail.value = {
    src: detailSrc
  }
}
const closeDetail = () => {
  showDetail.value = false
}

</script>

<template>
  <div class="plugin-svg-manage-container" v-show="showSvgManage">
    <div class="plugin-svg-manage-sidebar" :class="{ active: !!showDetail }">
      <div class="plugin-svg-manage-sidebar-header-wrap" @click="closeDetail">
        <div>X</div>
      </div>
      <div class="plugin-svg-manage-sidebar-body">
        <div class="plugin-svg-manage-svg-wrap">
          <img :src="showDetail.src" class="plugin-svg-manage-svg">
        </div>
        <div class="plugin-svg-manage-sidebar-detail">
          <div class="info">
            <div class="title">Filepath</div>
            <div class="content">Filepath</div>
          </div>
          <div class="info">
            <div class="title">Public Path</div>
            <div class="content">Public Path</div>
          </div>
          <div class="info">
            <div class="title">Image Size</div>
            <div class="content">Image Size</div>
          </div>
          <div class="info">
            <div class="title">File size</div>
            <div class="content">File size</div>
          </div>
        </div>
        <div class="plugin-svg-manage-sidebar-action">
          <div class="title">Import Type(click to copy)</div>
          <div class="action">import Icon from './aa'</div>
          <div class="action">import Icon from './aa'</div>
          <div class="action">import Icon from './aa'</div>
          <div class="action">import Icon from './aa'</div>
        </div>
      </div>
    </div>
    <div class="plugin-svg-manage-header">
      <input type="text" placeholder="Search..." class="plugin-svg-manage-search" v-model="searchInput" />
      <h2 class="plugin-svg-manage-title">{{ assetsSvgs.length }} {{ assetsSvgs.length === 1 ? 'asset' : 'assets' }} in
        total</h2>
    </div>
    <div class="plugin-svg-manage-list-wrap">
      <div class="plugin-svg-manage-preview-container" v-for="({ title, list }, index) in computedList" :key="index">
        <div class="plugin-svg-manage-preview-title">{{ title }}</div>
        <div class="plugin-svg-manage-preview-list">
          <div class="plugin-svg-manage-preview" v-for="src in list" :key="src" @click="() => openDetail(src)">
            <div class="plugin-svg-manage-svg-wrap">
              <img :src="src" class="plugin-svg-manage-svg">
            </div>
            <div class="plugin-svg-manage-name">{{ src.substring(src.lastIndexOf('/') + 1) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('./overlay.css');
</style>
