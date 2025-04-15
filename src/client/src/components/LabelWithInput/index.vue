<template>
  <div class="flex items-center gap-2">
    <div class="text-neutral-500" v-show="!isInput" @dblclick="() => isInput = true">{{ label }}</div>
    <div ref="inputRef">
      <NInput 
        size="small"
        v-show="isInput" 
        v-model:value="inputValue" 
        @keyup.esc="blurEvent" 
        @keyup.enter="enterEvent"
        @blur="blurEvent"
        autofocus
      />
    </div>
  </div>
</template>

<script setup>
import { NInput } from 'naive-ui';
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  label: {
    type: String,
    required: true
  }
})
const emit = defineEmits(['submit'])

const isInput = ref(false)
const inputValue = ref(props.label.slice(0, props.label.length - 4))
const inputRef = ref(null)

const blurEvent = () => {
  isInput.value = false
  inputValue.value = props.label.slice(0, props.label.length - 4)
}

const enterEvent = () => {
  isInput.value = false
  emit('submit', inputValue.value)
}

const handleClickOutside = (event) => {
  if (inputRef.value && !inputRef.value.contains(event.target)) {
    isInput.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped></style>