<script setup>
import SvgManageCMP from './components/SvgManageCMP/index.vue'
</script>

<template>
  <Suspense>
    <div class="w-screen h-screen p-4 overflow-y-auto overflow-x-hidden scrollbar">
      <SvgManageCMP />
    </div>
  </Suspense>
</template>

<style>
.scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 8px;
}

.scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(128, 128, 128, .1);
  border-radius: 4px;
}

.scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
</style>