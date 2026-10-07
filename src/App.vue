<script setup lang="ts">
import { ref } from 'vue';
import GalaFooter from './components/GalaFooter.vue';
import GalaHeader from './components/GalaHeader.vue';
import StatsDashboard from './components/StatsDashboard.vue';
import StoryMode from './components/StoryMode.vue';
import UploadSection from './components/UploadSection.vue';
import { calculateAwards } from './lib/awards';
import { parseChatFile, parseChatText } from './lib/parser';
import { SAMPLE_CHAT_NAME, SAMPLE_CHAT_TEXT } from './lib/sampleChat';
import { calculateGroupStats } from './lib/stats';
import type { Award, GroupStats, ParsedChat } from './lib/types';

const parsedChat = ref<ParsedChat | null>(null);
const awards = ref<Award[]>([]);
const stats = ref<GroupStats | null>(null);

const activeView = ref<'story' | 'stats'>('story');
const useInitials = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

async function onFileSelected(file: File) {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const parsed = await parseChatFile(file);
    if (parsed.messages.length === 0) {
      throw new Error('No valid messages found in this chat export. Please check the file format.');
    }
    loadChatData(parsed);
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to parse chat file.';
  } finally {
    isLoading.value = false;
  }
}

function onLoadSample() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const parsed = parseChatText(SAMPLE_CHAT_TEXT, SAMPLE_CHAT_NAME);
    loadChatData(parsed);
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load sample chat.';
  } finally {
    isLoading.value = false;
  }
}

function loadChatData(chat: ParsedChat) {
  parsedChat.value = chat;
  awards.value = calculateAwards(chat);
  stats.value = calculateGroupStats(chat);
  activeView.value = 'story';
}

function resetChat() {
  parsedChat.value = null;
  awards.value = [];
  stats.value = null;
  errorMessage.value = '';
}
</script>

<template>
  <div class="min-h-screen bg-velvet-950 text-sand-100 flex flex-col justify-between selection:bg-gold-500/30 selection:text-gold-200">
    <main class="flex-1 flex flex-col">
      <!-- Gala App Header -->
      <GalaHeader
        :active-view="activeView"
        :use-initials="useInitials"
        :chat-loaded="parsedChat !== null"
        :chat-title="parsedChat?.title ?? 'Group Chat Awards'"
        @toggle-initials="useInitials = !useInitials"
        @switch-view="(v) => (activeView = v)"
        @reset-chat="resetChat"
      />

      <!-- Loading State -->
      <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center p-8 gap-4">
        <div class="w-12 h-12 rounded-full border-3 border-velvet-700 border-t-gold-400 animate-spin"></div>
        <p class="text-sm font-serif text-gold-300 animate-pulse tracking-wide">
          Unfolding gala awards night...
        </p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="max-w-md mx-auto my-8 p-4 rounded-xl bg-red-950/40 border border-red-800 text-center">
        <p class="text-sm text-red-300 font-semibold mb-3">{{ errorMessage }}</p>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-velvet-800 border border-velvet-600 text-xs text-sand-200 hover:text-sand-50"
          @click="resetChat"
        >
          Try Again
        </button>
      </div>

      <!-- View Content -->
      <template v-else>
        <!-- Upload & First View -->
        <UploadSection
          v-if="!parsedChat"
          @file-selected="onFileSelected"
          @load-sample="onLoadSample"
        />

        <!-- Story Presentation Mode -->
        <StoryMode
          v-else-if="activeView === 'story'"
          :awards="awards"
          :chat-title="parsedChat.title"
          :use-initials="useInitials"
          @view-stats="activeView = 'stats'"
        />

        <!-- Group Stats & Dashboard Mode -->
        <StatsDashboard
          v-else-if="activeView === 'stats' && stats"
          :stats="stats"
          :awards="awards"
          :chat-title="parsedChat.title"
          :use-initials="useInitials"
          @back-to-story="activeView = 'story'"
        />
      </template>
    </main>

    <!-- Gala Footer -->
    <GalaFooter />
  </div>
</template>
