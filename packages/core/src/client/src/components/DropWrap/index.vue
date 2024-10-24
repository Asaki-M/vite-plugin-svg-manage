<template>
  <div ref="dropZoneRef" class="w-full">
    <slot :isOverDropZone="isOverDropZone"></slot>
  </div>
</template>

<script setup>
import { useDropZone } from '@vueuse/core'
import { ref } from 'vue';

const props = defineProps({
  dropDataTypes: {
    type: Array,
    default: []
  },
  dropMuliple: {
    type: Boolean,
    default: true
  },
  dropPreventDefaultForUnhandled: {
    type: Boolean,
    default: false
  },
  overDropClass: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['onDrop'])

const dropZoneRef = ref()

const onDrop = (files) => {
  emit('onDrop', files)
}

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  // specify the types of data to be received.
  dataTypes: props.dropDataTypes,
  // control multi-file drop
  multiple: props.dropMuliple,
  // whether to prevent default behavior for unhandled events
  preventDefaultForUnhandled: props.dropPreventDefaultForUnhandled,
})
</script>