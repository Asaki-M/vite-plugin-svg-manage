<template>
  <DropWrap :dropDataTypes="['image/svg+xml']" :dropMuliple="false" v-slot="slotProps" @onDrop="onDropFile">
    <textarea
      v-if="!dropSvg"
      class="w-full b-1 rounded-1 px3 py-0.75 resize-none color-gray-800 border-primary-100 outline-none plugin-svg-manage-drop-textarea"
      :class="{ 'bg-green-100/30': slotProps.isOverDropZone }" rows="12" placeholder="Input or Drop.." 
      :value="content"
      @input="(e) => emit('update:content', e.target.value)"
      @click="() => focused = true"></textarea>

    <div class="w-full flex items-center justify-center relative" :class="{ 'bg-green-100/30': slotProps.isOverDropZone }" v-else>
      <img :src="dropSvg" class="w-1/2">
      <NIcon class="absolute top-0 right-0 w-5 h-5 cursor-pointer transition-colors hover:text-emerald-500" @click="clearDropFile">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32"><path fill="currentColor" d="M16 2C8.2 2 2 8.2 2 16s6.2 14 14 14s14-6.2 14-14S23.8 2 16 2zm0 26C9.4 28 4 22.6 4 16S9.4 4 16 4s12 5.4 12 12s-5.4 12-12 12z"/><path fill="currentColor" d="M21.4 23L16 17.6L10.6 23L9 21.4l5.4-5.4L9 10.6L10.6 9l5.4 5.4L21.4 9l1.6 1.6l-5.4 5.4l5.4 5.4z"/></svg>
      </NIcon>
    </div>
  </DropWrap>
</template>

<script setup>
import { ref } from 'vue';
import { readFilesAsArrayBuffer } from 'UTIL'
import { NIcon } from 'naive-ui';
import DropWrap from '../DropWrap/index.vue'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:content', 'dropFile']);

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