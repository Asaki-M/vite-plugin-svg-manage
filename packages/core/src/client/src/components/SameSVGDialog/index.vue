<template>
  <VueDialog height="fit-content" v-model="show" title="Already exist this SVG">
    <template #default>
      <div class="flex flex-col gap-4 py-4 border-b border-grey-400" v-for="(item, idx) in result" :key="idx">
        <div class="flex flex-col gap-2 ">
          <div class="text-red-500">Filepath: </div>
          <div class="text-red-500">{{ item?.filePath || '' }}</div>
        </div>
        <div class="flex flex-col gap-2">
          <div class="text-red-500">Preview:</div>
          <img class="w-16 h-16" :src="item?.publicPath" />
        </div>
      </div>

    </template>
  </VueDialog>
</template>

<script setup>
import { VueDialog } from '@vue/devtools-ui';
const show = defineModel('show', { required: true })
const props = defineProps(['result'])
</script>
