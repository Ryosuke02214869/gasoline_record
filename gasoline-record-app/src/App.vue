<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
</script>

<template>
  <Toast position="top-right" />
  <RouterView />
</template>
