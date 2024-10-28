<template>
  <div ref="dropdownRef" class="relative inline-block">

    <div @click="toggleDropdown">
      <slot name="trigger">
        <VueInput v-model="selectedValue" placeholder="Select..."></VueInput>
      </slot>
    </div>

    <transition name="fade">
      <div v-if="isOpen" class="absolute mt-2 w-full bg-white shadow-lg rounded p-2 z-10">
        <ul>
          <li v-for="option in options" :key="option.value" @click="handleSelect(option)"
            class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black">
            {{ option.label }}
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { VueInput } from '@vue/devtools-ui';

const props = defineProps({
  options: {
    type: Array,
    default: () => []
  }
})

const selectedValue = defineModel('selectedValue', { required: true })

const isOpen = ref(false)
const dropdownRef = ref(null)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const handleSelect = (option) => {
  isOpen.value = false
  selectedValue.value = option.value
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
