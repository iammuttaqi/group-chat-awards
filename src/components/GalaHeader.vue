<script setup lang="ts">
defineProps<{
  activeView: 'story' | 'stats';
  useInitials: boolean;
  chatLoaded: boolean;
  chatTitle: string;
}>();

defineEmits<{
  (e: 'toggleInitials'): void;
  (e: 'switchView', view: 'story' | 'stats'): void;
  (e: 'resetChat'): void;
}>();
</script>

<template>
  <header class="border-b border-velvet-700/80 bg-velvet-900/90 backdrop-blur-md px-4 py-3 sticky top-0 z-40">
    <div class="max-w-6xl mx-auto flex items-center justify-between gap-2">
      <!-- Title & Branding -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex items-center gap-2 text-left focus-visible:outline-2 focus-visible:outline-gold-400 rounded-md p-1 -m-1 transition-opacity hover:opacity-85"
          @click="$emit('resetChat')"
        >
          <span class="text-2xl" aria-hidden="true">🏆</span>
          <div>
            <h1 class="text-sm font-bold tracking-widest uppercase font-serif text-gold-400">
              Group Chat Awards
            </h1>
            <p v-if="chatLoaded" class="text-xs text-sand-400 truncate max-w-[140px] sm:max-w-[260px]">
              {{ chatTitle }}
            </p>
          </div>
        </button>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Initials Toggle -->
        <button
          v-if="chatLoaded"
          type="button"
          :aria-pressed="useInitials"
          class="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all focus-visible:outline-2 focus-visible:outline-gold-400 border"
          :class="
            useInitials
              ? 'bg-gold-500/20 text-gold-300 border-gold-400/60'
              : 'bg-velvet-800 text-sand-300 border-velvet-600 hover:text-sand-100 hover:border-velvet-500'
          "
          title="Toggle between full names and initials for privacy"
          @click="$emit('toggleInitials')"
        >
          <span class="w-2 h-2 rounded-full" :class="useInitials ? 'bg-gold-400' : 'bg-sand-400'"></span>
          <span>{{ useInitials ? 'Initials On' : 'Show Initials' }}</span>
        </button>

        <!-- View Switcher -->
        <div v-if="chatLoaded" class="flex items-center bg-velvet-850 p-0.5 rounded-lg border border-velvet-700">
          <button
            type="button"
            class="px-3 py-1 text-xs font-semibold rounded-md transition-all focus-visible:outline-2 focus-visible:outline-gold-400"
            :class="
              activeView === 'story'
                ? 'bg-gold-500 text-velvet-950 shadow-sm'
                : 'text-sand-300 hover:text-sand-100'
            "
            @click="$emit('switchView', 'story')"
          >
            Story
          </button>
          <button
            type="button"
            class="px-3 py-1 text-xs font-semibold rounded-md transition-all focus-visible:outline-2 focus-visible:outline-gold-400"
            :class="
              activeView === 'stats'
                ? 'bg-gold-500 text-velvet-950 shadow-sm'
                : 'text-sand-300 hover:text-sand-100'
            "
            @click="$emit('switchView', 'stats')"
          >
            Stats
          </button>
        </div>

        <!-- New Chat Button -->
        <button
          v-if="chatLoaded"
          type="button"
          class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-velvet-800 border border-velvet-600 text-sand-300 hover:text-sand-100 hover:border-velvet-500 transition-all focus-visible:outline-2 focus-visible:outline-gold-400"
          @click="$emit('resetChat')"
        >
          New Chat
        </button>
      </div>
    </div>
  </header>
</template>
