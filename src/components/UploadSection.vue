<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'fileSelected', file: File): void;
  (e: 'loadSample'): void;
}>();

const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  if (!event.dataTransfer?.files.length) return;
  const file = event.dataTransfer.files[0];
  validateAndEmit(file);
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files?.length) {
    validateAndEmit(target.files[0]);
  }
}

const errorMessage = ref('');

function validateAndEmit(file: File) {
  const name = file.name.toLowerCase();
  if (!name.endsWith('.txt') && !name.endsWith('.zip')) {
    errorMessage.value = 'Please upload a WhatsApp .txt or .zip chat export.';
    return;
  }
  errorMessage.value = '';
  emit('fileSelected', file);
}

function triggerFileInput() {
  fileInputRef.value?.click();
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 sm:py-14 text-center">
    <!-- Spotlight Effect Background -->
    <div class="relative">
      <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Hero Header -->
      <div class="relative z-10 mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-velvet-800 border border-gold-500/30 text-gold-300 text-xs font-semibold tracking-wider uppercase mb-4">
          <span>★</span>
          <span>Annual Gala Edition</span>
          <span>★</span>
        </div>
        <h2 class="text-3xl sm:text-5xl font-black font-serif text-sand-50 tracking-tight mb-4">
          Group Chat <span class="text-gold-400">Awards</span>
        </h2>
        <p class="text-base sm:text-lg text-sand-300 max-w-lg mx-auto leading-relaxed">
          Drop in your WhatsApp chat export. Unfurl an opulent awards night for the crew: who talks most, who sends voice notes at 3 AM, and who lurks in silence.
        </p>
      </div>

      <!-- Privacy Guarantee Banner -->
      <div class="relative z-10 mb-8 p-4 rounded-xl bg-velvet-850 border border-gold-500/30 max-w-md mx-auto shadow-lg text-left flex items-start gap-3">
        <span class="text-2xl mt-0.5" aria-hidden="true">🔒</span>
        <div>
          <h3 class="text-sm font-bold text-gold-300">100% Private in Your Browser</h3>
          <p class="text-xs text-sand-300 mt-0.5 leading-normal">
            Your chats are never uploaded or sent to any server. Everything is parsed and rendered entirely on your device.
          </p>
        </div>
      </div>

      <!-- Dropzone Card -->
      <div
        class="relative z-10 p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer mb-6"
        :class="
          isDragging
            ? 'border-gold-400 bg-velvet-800/90 scale-[1.01]'
            : 'border-velvet-600 bg-velvet-850/70 hover:border-gold-500/60 hover:bg-velvet-800/50'
        "
        tabindex="0"
        role="button"
        aria-label="Upload chat export file"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
        @keydown.enter="triggerFileInput"
        @keydown.space.prevent="triggerFileInput"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".txt,.zip"
          class="hidden"
          @change="handleFileChange"
        />

        <div class="flex flex-col items-center justify-center gap-3">
          <div class="w-16 h-16 rounded-full bg-velvet-700/80 border border-gold-500/40 flex items-center justify-center text-3xl shadow-inner">
            📥
          </div>
          <div>
            <p class="text-base sm:text-lg font-bold text-sand-100">
              Drop your WhatsApp export here
            </p>
            <p class="text-xs sm:text-sm text-sand-400 mt-1">
              Supports .txt or .zip export files from iPhone and Android
            </p>
          </div>
          <button
            type="button"
            class="mt-2 px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-velvet-950 font-bold text-sm tracking-wide transition-all shadow-md active:scale-95"
            @click.stop="triggerFileInput"
          >
            Choose Chat File
          </button>
        </div>
      </div>

      <!-- Error notice -->
      <p v-if="errorMessage" class="text-sm text-red-400 mb-6 bg-red-950/40 border border-red-800/60 p-2.5 rounded-lg max-w-md mx-auto">
        {{ errorMessage }}
      </p>

      <!-- One-Click Sample Chat -->
      <div class="relative z-10 flex flex-col items-center gap-2">
        <p class="text-xs text-sand-400 uppercase tracking-widest font-semibold">
          Don't have an export ready?
        </p>
        <button
          type="button"
          class="px-5 py-2.5 rounded-xl bg-velvet-800 hover:bg-velvet-750 border border-gold-500/40 text-gold-300 hover:text-gold-200 font-semibold text-sm transition-all shadow-sm active:scale-95 flex items-center gap-2"
          @click="$emit('loadSample')"
        >
          <span>✨</span>
          <span>Try Sample Chat (The Weekend Crew)</span>
        </button>
      </div>

      <!-- Instructions Accordion / Card -->
      <div class="mt-12 text-left bg-velvet-900/60 border border-velvet-700/80 rounded-xl p-5 max-w-lg mx-auto">
        <h4 class="text-xs font-bold text-gold-400 uppercase tracking-wider mb-3">
          How to export your chat from WhatsApp:
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-sand-300">
          <div class="border-l-2 border-gold-500/40 pl-3">
            <span class="font-bold text-sand-100 block mb-1">iPhone (iOS):</span>
            <p>Open chat → Tap group name at top → Scroll to bottom → Tap <strong>Export Chat</strong> → Choose <strong>Without Media</strong>.</p>
          </div>
          <div class="border-l-2 border-gold-500/40 pl-3">
            <span class="font-bold text-sand-100 block mb-1">Android:</span>
            <p>Open chat → Tap <strong>⋮ Menu</strong> (top right) → More → <strong>Export Chat</strong> → Choose <strong>Without Media</strong>.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
