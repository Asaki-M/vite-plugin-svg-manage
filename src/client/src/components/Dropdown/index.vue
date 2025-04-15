<template>
  <div ref="dropdownRef" class="relative inline-block">

    <div @click="toggleDropdown">
      <slot name="trigger">
        <NInput :value="selectedValue" @update:value="(val) => emit('update:selectedValue', val)"
          placeholder="Select..."></NInput>
      </slot>
    </div>

    <transition name="fade">
      <div v-if="isOpen" class="absolute mt-2 w-full bg-white shadow-lg rounded py-2 z-10">
        <div v-for="option in options" :key="option.value"
          class="h-8 px-4 flex items-center cursor-pointer hover:bg-gray-100" @click="handleSelect(option.value)">
          {{ option.label }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { NInput } from 'naive-ui';

const props = defineProps({
  options: {
    type: Array,
    default: () => []
  },
  selectedValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:selectedValue']);

const isOpen = ref(false)
const dropdownRef = ref(null)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const handleSelect = (value) => {
  isOpen.value = false
  emit('update:selectedValue', value)
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
