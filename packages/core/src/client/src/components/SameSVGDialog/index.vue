<template>
  <VueDialog height="40rem" v-model="show" title="Already exist this SVG">
    <template #default>
      <div class="flex flex-col gap-4 py-4 border-b border-grey-400" v-for="(item, idx) in result" :key="idx">
        <div class="flex flex-col gap-2 ">
          <div class="text-red-500">Filepath: </div>
          <div class="text-red-500">{{ item?.filePath || '' }}</div>
        </div>
        <div class="flex flex-col gap-2">
          <div class="text-red-500">Preview:</div>
          <div
            class="group flex justify-center items-center rounded w-16 h-16 bg-neutral-50 border border-neutral-200 cursor-pointer">
            <img :src="item.publicPath" class="w-9/12 group-hover:scale-125 transition-all duration-200">
          </div>
        </div>
      </div>
    </template>
  </VueDialog>
</template>

<script setup>
import { VueDialog } from '@vue/devtools-ui';
import { nextTick, watch } from 'vue';
const show = defineModel('show', { required: true })
const props = defineProps(['result'])

watch(show, () => {
  if(show.value) {
    nextTick(() => {
      document.querySelector('.modal').classList.add('overflow-auto')
      document.querySelector('.modal').classList.add('scrollbar')
    })
  }
})
</script>
