<script setup lang="ts">
defineProps<{
  result: string
}>();
</script>

<template>
  <div text="center 24px" font="bold italic" mt-10px>
    <div v-if="result === 'draw'">
      平局
    </div>
    <div v-else-if="['playerAWon', 'playerBWon'].includes(result)" :style="{ color: result === 'playerBWon' ? '#F94848' : '#4876EC' }" flex-center>
      <div id="lottie-trophy" mr2 w50px h50px />
      {{ result === 'playerBWon' ? '红方' : '蓝方' }} <span text-yellow ml-4>胜利</span>
    </div>
    <div v-else>
      无结果
    </div>
  </div>
</template>
