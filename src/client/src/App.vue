<script setup>
import { NConfigProvider, NNotificationProvider } from 'naive-ui'
import SvgManageCMP from './components/SvgManageCMP/index.vue'
</script>

<template>
  <Suspense>
    <NNotificationProvider placement="top">
      <div class="w-screen h-screen p-4 overflow-y-auto overflow-x-hidden scrollbar">
        <SvgManageCMP />
      </div>
    </NNotificationProvider>
  </Suspense>
</template>

<style>
.scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scrollbar::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 100px;
}

.scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

* {
  box-sizing: border-box;
}
</style>