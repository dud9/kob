<script setup lang="ts">
import type { PlayerInfo } from '../utils/types';
import defaultAvatar from '~/assets/default-avatar.png';

defineProps<{
  player: PlayerInfo
  color: string
  side: string
}>();
</script>

<template>
  <div flex="col center" gap-y-4>
    <div :style="{ color }" text="18px" font-bold>
      {{ side }}
    </div>
    <n-avatar
      round
      :size="60"
      :src="player.avatar ?? defaultAvatar"
    />
    <n-ellipsis :style="{ maxWidth: '80px' }">
      {{ player.name ?? '-' }}
    </n-ellipsis>
  </div>
</template>
