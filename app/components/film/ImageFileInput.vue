<script setup lang="ts">
import { IMAGE_FILE_ACCEPT } from '~/utils/image'

withDefaults(
  defineProps<{
    id: string
    multiple?: boolean
    inputClass?: string
  }>(),
  { multiple: false, inputClass: 'pointer-events-none fixed top-0 left-0 size-px opacity-0' }
)

const emit = defineEmits<{ files: [files: File[]] }>()

const handleInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files?.length) emit('files', [...input.files])
  input.value = ''
}
</script>

<template>
  <input
    :id="id"
    :class="inputClass"
    type="file"
    :multiple="multiple"
    :accept="IMAGE_FILE_ACCEPT"
    @change="handleInput"
  />
</template>
