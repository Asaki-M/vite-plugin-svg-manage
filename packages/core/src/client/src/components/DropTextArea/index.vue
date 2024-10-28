<template>
  <DropWrap :dropDataTypes="['image/svg+xml']" :dropMuliple="false" v-slot="slotProps" @onDrop="onDropFile">
    <textarea
      v-if="!dropSvg"
      class="w-full b-1 rounded-1 px3 py-0.75 resize-none color-gray-800 border-primary-100 outline-none plugin-svg-manage-drop-textarea"
      :class="{ 'bg-green-100/30': slotProps.isOverDropZone }" rows="12" placeholder="Input or Drop.." v-model="content"
      @click="() => focused = true"></textarea>

    <div class="w-full flex items-center justify-center relative" :class="{ 'bg-green-100/30': slotProps.isOverDropZone }" v-else>
      <img :src="dropSvg" class="w-1/2">
      <VueIcon icon="i-carbon-close-filled" class="absolute top-0 right-0 w-5 h-5 cursor-pointer transition-colors hover:text-emerald-500" @click="clearDropFile"></VueIcon>
    </div>
  </DropWrap>
</template>

<script setup>
import { ref } from 'vue';
import { readFilesAsArrayBuffer } from 'UTIL'
import { VueIcon } from '@vue/devtools-ui';
import DropWrap from '../DropWrap/index.vue'


const emit = defineEmits(['dropFile'])
const content = defineModel('content', { required: true })
const focused = ref(false)
const dropSvg = ref('')

const onDropFile = async ({ files }) => {
  const result = await readFilesAsArrayBuffer(files)
  const { content } = result[0]
  dropSvg.value = content
  emit('dropFile', result)
}

const clearDropFile = () => {
  dropSvg.value = ''
  emit('dropFile', [])
}
</script>

<style scoped>
.plugin-svg-manage-drop-textarea:focus {
  position: relative;
  border-bottom: 2px solid #42b983;
  transition: border-color .2s;
}
</style>