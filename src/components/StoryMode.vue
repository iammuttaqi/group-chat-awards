<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { shareOrDownload } from '../lib/storyRenderer';
import type { Award } from '../lib/types';
import { displayName } from '../lib/stats';

const props = defineProps<{
  awards: Award[];
  chatTitle: string;
  useInitials: boolean;
}>();

const emit = defineEmits<{
  (e: 'viewStats'): void;
}>();

const currentIndex = ref(0);
const isRevealed = ref(false);
const isGeneratingImage = ref(false);
const feedbackToast = ref('');

const currentAward = computed(() => props.awards[currentIndex.value] ?? null);

const currentWinnerDisplay = computed(() => {
  if (!currentAward.value) return '';
  return displayName(currentAward.value.winner, props.useInitials);
});

// Reset reveal state whenever changing slide
watch(currentIndex, () => {
  isRevealed.value = false;
});

function revealEnvelope() {
  isRevealed.value = true;
}

function nextSlide() {
  if (currentIndex.value < props.awards.length - 1) {
    currentIndex.value++;
  } else {
    emit('viewStats');
  }
}

function prevSlide() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
}

function goToSlide(index: number) {
  currentIndex.value = index;
}

// Keyboard navigation
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault();
    nextSlide();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prevSlide();
  } else if (e.key === 'Enter') {
    revealEnvelope();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

async function handleShareOrDownload() {
  if (!currentAward.value) return;
  isGeneratingImage.value = true;
  feedbackToast.value = 'Preparing story card...';

  try {
    const result = await shareOrDownload({
      award: currentAward.value,
      winnerDisplayName: currentWinnerDisplay.value,
      chatTitle: props.chatTitle,
    });
    feedbackToast.value = result.message;
  } catch {
    feedbackToast.value = 'Could not generate story card.';
  } finally {
    isGeneratingImage.value = false;
    setTimeout(() => {
      feedbackToast.value = '';
    }, 3500);
  }
}
</script>

<template>
  <div class="relative w-full max-w-md mx-auto min-h-[calc(100vh-65px)] flex flex-col justify-between p-4 sm:p-6 select-none">
    <!-- Story Segment Progress Indicators -->
    <div class="flex items-center gap-1.5 mb-4 z-20" role="tablist" aria-label="Awards Story Progress">
      <button
        v-for="(award, idx) in awards"
        :key="award.id"
        type="button"
        role="tab"
        :aria-selected="idx === currentIndex"
        :aria-label="`Slide ${idx + 1}: ${award.title}`"
        class="h-1.5 flex-1 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-gold-400"
        :class="
          idx === currentIndex
            ? 'bg-gold-400 scale-y-125'
            : idx < currentIndex
              ? 'bg-gold-600/70'
              : 'bg-velvet-700/80'
        "
        @click="goToSlide(idx)"
      />
    </div>

    <!-- Main Card Body (Gala Award) -->
    <div class="relative flex-1 flex flex-col items-center justify-center">
      <!-- Background Sweeping Spotlight -->
      <div
        class="absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-96 pointer-events-none transition-all duration-700"
        :class="isRevealed ? 'opacity-100 scale-105' : 'opacity-40 scale-95'"
      >
        <div class="w-full h-full bg-radial from-gold-500/25 via-gold-500/5 to-transparent blur-2xl"></div>
      </div>

      <!-- Award Presentation Card -->
      <div
        v-if="currentAward"
        class="relative w-full rounded-2xl bg-gradient-to-b from-velvet-800 to-velvet-900 border border-gold-500/40 p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl overflow-hidden transition-all duration-300"
      >
        <!-- Gold corner trims -->
        <div class="absolute top-2 left-2 text-gold-500/60 text-xs font-serif" aria-hidden="true">✦</div>
        <div class="absolute top-2 right-2 text-gold-500/60 text-xs font-serif" aria-hidden="true">✦</div>
        <div class="absolute bottom-2 left-2 text-gold-500/60 text-xs font-serif" aria-hidden="true">✦</div>
        <div class="absolute bottom-2 right-2 text-gold-500/60 text-xs font-serif" aria-hidden="true">✦</div>

        <!-- Award Icon & Category Badge -->
        <div class="w-16 h-16 rounded-full bg-velvet-700 border-2 border-gold-400/80 flex items-center justify-center text-3xl shadow-lg mb-3">
          {{ currentAward.icon }}
        </div>

        <span class="text-xs font-bold text-gold-400 uppercase tracking-widest mb-1 font-serif">
          {{ currentAward.subtitle }}
        </span>

        <h3 class="text-2xl sm:text-3xl font-black font-serif text-sand-50 tracking-tight mb-2">
          {{ currentAward.title }}
        </h3>

        <p class="text-xs text-sand-300 max-w-xs mb-6 italic">
          "{{ currentAward.description }}"
        </p>

        <!-- The Gala Envelope Reveal Area -->
        <div class="w-full my-2">
          <!-- Unrevealed State: Sealed Envelope -->
          <div
            v-if="!isRevealed"
            class="group cursor-pointer w-full py-8 px-4 rounded-xl bg-velvet-850 border border-dashed border-gold-500/50 hover:border-gold-400 hover:bg-velvet-800 transition-all flex flex-col items-center justify-center gap-2 active:scale-98 shadow-inner"
            role="button"
            tabindex="0"
            aria-label="Tear envelope to reveal winner"
            @click="revealEnvelope"
            @keydown.enter="revealEnvelope"
            @keydown.space.prevent="revealEnvelope"
          >
            <div class="w-12 h-12 rounded-full bg-gold-500/20 border border-gold-400 flex items-center justify-center text-xl text-gold-300 group-hover:scale-110 transition-transform">
              ✉️
            </div>
            <p class="text-sm font-bold text-gold-300 tracking-wider uppercase font-serif">
              Tear Open Envelope
            </p>
            <span class="text-xs text-sand-400">Click to reveal the winner</span>
          </div>

          <!-- Revealed State: Gold Podium & Winner Display -->
          <div
            v-else
            class="w-full py-6 px-4 rounded-xl bg-gradient-to-b from-velvet-700/80 to-velvet-850 border border-gold-400/80 shadow-lg flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-300"
          >
            <span class="text-[11px] font-bold text-gold-300 uppercase tracking-widest font-serif">
              ★ Winner ★
            </span>

            <p class="text-2xl sm:text-3xl font-black font-serif text-gold-200 tracking-wide break-words max-w-full">
              {{ currentWinnerDisplay }}
            </p>

            <div class="inline-flex items-center px-3 py-1 rounded-full bg-gold-500/20 border border-gold-400/50 text-gold-300 font-bold text-xs mt-1">
              {{ currentAward.winningMetric }}
            </div>

            <p class="text-xs text-sand-300 mt-1">
              {{ currentAward.winningDetail }}
            </p>

            <p v-if="currentAward.runnerUp" class="text-[11px] text-sand-400 mt-2 border-t border-velvet-600/70 pt-2 w-full">
              Notable Runner Up: <span class="text-sand-200 font-medium">{{ displayName(currentAward.runnerUp.name, useInitials) }}</span> ({{ currentAward.runnerUp.metric }})
            </p>
          </div>
        </div>

        <!-- Slide Number Indicator -->
        <span class="text-[11px] text-sand-400 tracking-wider mt-4">
          Award {{ currentIndex + 1 }} of {{ awards.length }}
        </span>
      </div>
    </div>

    <!-- Navigation Tap Triggers (Invisible left/right overlay buttons for accessibility & keyboard) -->
    <div class="flex items-center justify-between gap-3 mt-4 z-20">
      <button
        type="button"
        class="flex-1 py-2.5 px-3 rounded-xl bg-velvet-800 border border-velvet-600 text-sand-300 hover:text-sand-100 hover:border-velvet-500 font-semibold text-xs transition-all disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-gold-400"
        :disabled="currentIndex === 0"
        @click="prevSlide"
      >
        ← Previous
      </button>

      <button
        type="button"
        class="flex-1 py-2.5 px-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-velvet-950 font-bold text-xs tracking-wide transition-all shadow-md active:scale-95 focus-visible:outline-2 focus-visible:outline-gold-400"
        @click="nextSlide"
      >
        {{ currentIndex === awards.length - 1 ? 'Finish Ceremony 🏆' : 'Next Award →' }}
      </button>
    </div>

    <!-- Bottom Actions: Download 1080x1920 Story Card & Share -->
    <div class="flex flex-col items-center gap-2 mt-4 z-20">
      <div class="flex items-center gap-2 w-full">
        <button
          type="button"
          :disabled="isGeneratingImage"
          class="flex-1 py-2.5 px-4 rounded-xl bg-velvet-800 hover:bg-velvet-750 border border-gold-500/40 text-gold-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-gold-400"
          @click="handleShareOrDownload"
        >
          <span>📲</span>
          <span>Download Story (1080×1920)</span>
        </button>

        <button
          type="button"
          class="py-2.5 px-4 rounded-xl bg-velvet-850 hover:bg-velvet-800 border border-velvet-600 text-sand-300 font-semibold text-xs transition-all focus-visible:outline-2 focus-visible:outline-gold-400"
          @click="$emit('viewStats')"
        >
          View All Stats
        </button>
      </div>

      <!-- Toast Feedback -->
      <p v-if="feedbackToast" class="text-xs text-gold-300 bg-velvet-900 border border-gold-500/40 py-1 px-3 rounded-full animate-pulse">
        {{ feedbackToast }}
      </p>
    </div>
  </div>
</template>
