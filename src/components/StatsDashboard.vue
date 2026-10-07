<script setup lang="ts">
import { computed } from 'vue';
import type { Award, GroupStats } from '../lib/types';
import { displayName } from '../lib/stats';

const props = defineProps<{
  stats: GroupStats;
  awards: Award[];
  chatTitle: string;
  useInitials: boolean;
}>();

defineEmits<{
  (e: 'backToStory'): void;
}>();

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getHeatmapIntensity(value: number): string {
  if (value === 0 || props.stats.maxHeatmapValue === 0) return 'bg-velvet-850/60';
  const ratio = value / props.stats.maxHeatmapValue;
  if (ratio < 0.25) return 'bg-gold-600/30 text-gold-300';
  if (ratio < 0.5) return 'bg-gold-500/50 text-gold-200';
  if (ratio < 0.75) return 'bg-gold-500/80 text-velvet-950';
  return 'bg-gold-400 text-velvet-950 font-bold';
}

const formattedBusiestDay = computed(() => {
  if (!props.stats.busiestDay.dateStr || props.stats.busiestDay.dateStr === 'None') return 'None';
  try {
    const [y, m, d] = props.stats.busiestDay.dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return props.stats.busiestDay.dateStr;
  }
});
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 space-y-10">
    <!-- Header Summary -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-velvet-700 pb-6">
      <div>
        <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-gold-500/15 border border-gold-400/40 text-gold-300 text-xs font-semibold tracking-wider uppercase mb-2">
          <span>Gala Digest</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-bold font-serif text-sand-50">
          {{ chatTitle }}
        </h2>
        <p class="text-xs sm:text-sm text-sand-400 mt-1">
          Activity from {{ stats.dateRangeStr }} • {{ stats.daysActive }} days analyzed
        </p>
      </div>

      <button
        type="button"
        class="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-velvet-950 font-bold text-xs tracking-wide transition-all shadow-md active:scale-95 flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-gold-400"
        @click="$emit('backToStory')"
      >
        <span>🎬</span>
        <span>Watch Story Ceremony</span>
      </button>
    </div>

    <!-- 4 Big Number Metrics -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="p-4 rounded-xl bg-velvet-850 border border-velvet-700/80">
        <span class="text-xs text-sand-400 block mb-1">Total Messages</span>
        <span class="text-2xl sm:text-3xl font-extrabold text-sand-50 font-serif">
          {{ stats.totalMessages.toLocaleString() }}
        </span>
      </div>

      <div class="p-4 rounded-xl bg-velvet-850 border border-velvet-700/80">
        <span class="text-xs text-sand-400 block mb-1">Participants</span>
        <span class="text-2xl sm:text-3xl font-extrabold text-gold-400 font-serif">
          {{ stats.totalSenders }}
        </span>
      </div>

      <div class="p-4 rounded-xl bg-velvet-850 border border-velvet-700/80">
        <span class="text-xs text-sand-400 block mb-1">Busiest Day</span>
        <span class="text-lg sm:text-xl font-bold text-sand-50 block truncate font-serif" :title="formattedBusiestDay">
          {{ formattedBusiestDay }}
        </span>
        <span class="text-xs text-gold-400 mt-0.5 block">
          {{ stats.busiestDay.count }} messages
        </span>
      </div>

      <div class="p-4 rounded-xl bg-velvet-850 border border-velvet-700/80">
        <span class="text-xs text-sand-400 block mb-1">Daily Average</span>
        <span class="text-2xl sm:text-3xl font-extrabold text-sand-50 font-serif">
          {{ Math.round(stats.totalMessages / stats.daysActive).toLocaleString() }}
        </span>
        <span class="text-xs text-sand-400 mt-0.5 block">msgs / day</span>
      </div>
    </div>

    <!-- Awards Winners Roster -->
    <div class="rounded-2xl bg-velvet-850 border border-gold-500/30 p-5 sm:p-6 shadow-xl">
      <div class="flex items-center justify-between mb-4 pb-2 border-b border-velvet-700">
        <h3 class="text-lg font-bold font-serif text-gold-300 flex items-center gap-2">
          <span>🏆</span>
          <span>Award Winners Roster</span>
        </h3>
        <span class="text-xs text-sand-400">{{ awards.length }} Awards Conferred</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="award in awards"
          :key="award.id"
          class="flex items-center justify-between p-3 rounded-lg bg-velvet-800/80 border border-velvet-700 hover:border-gold-500/40 transition-colors"
        >
          <div class="flex items-center gap-3">
            <span class="text-2xl" aria-hidden="true">{{ award.icon }}</span>
            <div>
              <p class="text-xs font-bold text-gold-400 font-serif">{{ award.title }}</p>
              <p class="text-[11px] text-sand-400">{{ award.subtitle }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-extrabold text-sand-100 font-serif">
              {{ displayName(award.winner, useInitials) }}
            </p>
            <span class="text-[10px] text-gold-300">{{ award.winningMetric }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Heatmap: Hour by Weekday -->
    <div class="rounded-2xl bg-velvet-850 border border-velvet-700 p-5 sm:p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-bold font-serif text-sand-100">
            Hour-by-Weekday Activity Heatmap
          </h3>
          <p class="text-xs text-sand-400 mt-0.5">
            When your group is most active throughout the week (00:00 – 23:00)
          </p>
        </div>
      </div>

      <div class="overflow-x-auto pb-2">
        <div class="min-w-[620px]">
          <!-- Hours Header -->
          <div class="flex items-center text-[10px] text-sand-400 mb-1 pl-10">
            <div v-for="h in [0, 3, 6, 9, 12, 15, 18, 21]" :key="h" class="flex-1 text-left">
              {{ h === 0 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a` }}
            </div>
          </div>

          <!-- Days Grid Rows -->
          <div class="space-y-1">
            <div
              v-for="(dayName, dayIdx) in DAYS_OF_WEEK"
              :key="dayName"
              class="flex items-center gap-1.5"
            >
              <span class="w-8 text-[11px] font-medium text-sand-400">{{ dayName }}</span>
              <div class="flex-1 grid grid-cols-24 gap-1">
                <div
                  v-for="h in HOURS"
                  :key="h"
                  class="h-6 rounded-sm transition-transform hover:scale-125 hover:z-10 relative flex items-center justify-center text-[9px] cursor-default"
                  :class="getHeatmapIntensity(stats.heatmap[dayIdx][h])"
                  :title="`${dayName} ${h}:00 - ${stats.heatmap[dayIdx][h]} messages`"
                />
              </div>
            </div>
          </div>

          <!-- Heatmap Legend -->
          <div class="flex items-center justify-end gap-2 text-[10px] text-sand-400 mt-4">
            <span>Low</span>
            <span class="w-3.5 h-3.5 rounded bg-velvet-850 border border-velvet-700"></span>
            <span class="w-3.5 h-3.5 rounded bg-gold-600/30"></span>
            <span class="w-3.5 h-3.5 rounded bg-gold-500/50"></span>
            <span class="w-3.5 h-3.5 rounded bg-gold-500/80"></span>
            <span class="w-3.5 h-3.5 rounded bg-gold-400"></span>
            <span>Peak</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Words & Participant Leaderboard -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Top Words -->
      <div class="rounded-2xl bg-velvet-850 border border-velvet-700 p-5 sm:p-6">
        <h3 class="text-base font-bold font-serif text-sand-100 mb-1">
          Top Words
        </h3>
        <p class="text-xs text-sand-400 mb-4">
          Most frequent words with common stop-words removed
        </p>

        <div v-if="stats.topWords.length > 0" class="flex flex-wrap gap-2">
          <span
            v-for="(w, idx) in stats.topWords"
            :key="w.word"
            class="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border"
            :class="
              idx < 3
                ? 'bg-gold-500/15 text-gold-300 border-gold-400/50 font-bold'
                : 'bg-velvet-800 text-sand-300 border-velvet-700'
            "
          >
            <span>{{ w.word }}</span>
            <span class="text-[10px] opacity-70">({{ w.count }})</span>
          </span>
        </div>
        <p v-else class="text-xs text-sand-400 italic">No text messages found to extract words.</p>
      </div>

      <!-- Participant Leaderboard -->
      <div class="rounded-2xl bg-velvet-850 border border-velvet-700 p-5 sm:p-6">
        <h3 class="text-base font-bold font-serif text-sand-100 mb-1">
          Chat Volume Leaderboard
        </h3>
        <p class="text-xs text-sand-400 mb-4">
          Percentage of all group messages by participant
        </p>

        <div class="space-y-3">
          <div
            v-for="s in stats.senderCounts.slice(0, 8)"
            :key="s.name"
            class="text-xs"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-sand-200">
                {{ displayName(s.name, useInitials) }}
              </span>
              <span class="text-sand-400">
                {{ s.count.toLocaleString() }} msgs ({{ s.percentage }}%)
              </span>
            </div>
            <div class="w-full h-2 rounded-full bg-velvet-800 overflow-hidden">
              <div
                class="h-full bg-gold-500 rounded-full transition-all duration-500"
                :style="{ width: `${s.percentage}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
