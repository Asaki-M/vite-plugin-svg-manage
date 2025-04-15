<template>
  <NModal v-model:show="show" style="width: 500px;" title="Already exist this SVG" preset="card" :mask-closable="true"
    class="scrollbar">
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
  </NModal>
</template>

<script setup>
import { NModal } from 'naive-ui';
import { ref, watch } from 'vue';

const show = defineModel('show', { required: true })
const props = defineProps({
  result: {
    type: Array,
    default: () => []
  }
})

console.log(props.result)
</script>
