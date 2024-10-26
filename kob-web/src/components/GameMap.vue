<script setup lang="ts">
import { GameMap } from '~/game/map';

const refParentEl = ref<HTMLElement>();
const refCanvas = ref<HTMLCanvasElement>();

const pkStore = usePkStore();
const recordStore = useRecordStore();
let gameMap: GameMap | null = null;

const sendStartGameSingal = () => {
  if (!pkStore.socket)
    return;
  pkStore.socket.send(JSON.stringify({
    event: 'start-game',
  }));
};

function createGameMap() {
  const { value: canvas } = refCanvas;
  gameMap?.destroy();
  gameMap = new GameMap(canvas!.getContext('2d')!, refParentEl.value!);
  pkStore.updateGameState({ gameMapObject: gameMap as any });

  if (recordStore.isRecording) {
    recordStore.setReplayFinished(false);
  } else {
    sendStartGameSingal();
  }
}

const replayVideo = () => createGameMap();
const pauseVideo = () => gameMap?.pause(); // 暂停
const resumeVideo = () => gameMap?.resume(); // 取消暂停

onMounted(createGameMap);

onUnmounted(() => {
  if (gameMap) {
    gameMap.destroy();
  }
});

defineExpose({
  replayVideo,
  pauseVideo,
  resumeVideo,
});
</script>

<template>
  <div ref="refParentEl" hw-full flex-center>
    <canvas ref="refCanvas" tabindex="0" />
  </div>
</template>
