<script setup lang="ts">
import type { PlayerInfo } from '../utils/types';
import GameResult from './video/GameResult.vue';
import PlayerInfoCard from './video/PlayerInfoCard.vue';

const props = defineProps<{
  playerInfoList: PlayerInfo[]
}>();

const changeCurrentTab = inject<Function>('changeCurrentTab')!;

const { contentStyle } = useLayoutStyle({ heightProperty: 'minHeight', additionalOffset: 55 });

const refGameMap = ref();
const recordStore = useRecordStore();
const { gameResult, isReplayFinished } = storeToRefs(recordStore);

const recordPaused = ref(false); // 当前是否暂停
const isAutoPaused = ref(false); // 是否是自动暂停（页面隐藏导致的暂停）
let lastPauseTime: number | null = null; // 记录暂停时的时间戳

const pause = () => {
  if (refGameMap.value?.pauseVideo) {
    refGameMap.value.pauseVideo();
    recordPaused.value = true;
  }
};

const resume = () => {
  if (refGameMap.value?.resumeVideo) {
    refGameMap.value.resumeVideo();
    recordPaused.value = false;
  }
};

const replay = () => {
  if (refGameMap.value?.replayVideo) {
    refGameMap.value.replayVideo();
    recordPaused.value = false;
  }
};

const goBack = () => {
  pause();
  recordStore.resetRecordState();
  changeCurrentTab(0, {});
};

const doPause = () => {
  if (recordPaused.value) {
    resume();
  } else {
    pause();
  }
  isAutoPaused.value = false;
};

const handleVisibilityChange = () => {
  if (!refGameMap.value)
    return;

  if (document.hidden) {
    if (!recordPaused.value) {
      isAutoPaused.value = true;
      lastPauseTime = Date.now(); // 记录暂停时间
      pause();
    }
  } else {
    if (isAutoPaused.value) {
      isAutoPaused.value = false;
      // 如果暂停时间很短（比如小于100ms），可以考虑不进行任何处理
      const pauseDuration = lastPauseTime ? Date.now() - lastPauseTime : 0;
      if (pauseDuration < 100) {
        return;
      }
      // 使用 nextTick 确保状态更新后再恢复播放
      nextTick(() => {
        useTimeoutFn(resume, 500);
      });
    }
  }
};

let visibilityChangeListenerAdded = false;

onMounted(() => {
  useLottie({
    containerId: '#lottie-trophy',
    path: '/lottie/trophy.json',
  });

  if (!visibilityChangeListenerAdded) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    visibilityChangeListenerAdded = true;
  }
});

onUnmounted(() => {
  if (refGameMap.value) {
    refGameMap.value.destroy(); // 销毁 GameMap 实例
    refGameMap.value = null; // 清空引用
  }
  pause();
  if (visibilityChangeListenerAdded) {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    visibilityChangeListenerAdded = false;
  }
});
</script>

<template>
  <div :style="contentStyle" flex="col center">
    <div
      flex-center relative
      text="30px center"
      :style="{
        height: '10vh',
        width: 'calc(50vw + 300px)',
        fontWeight: 'bold',
      }"
    >
      <div mr-10>
        录像回放
      </div>
      <div absolute right-0 flex gap-x-5 lt-md="right-35px gap-x-2">
        <n-button type="primary" text-color="white" :disabled="!isReplayFinished" @click="replay">
          重新回放
        </n-button>
        <n-button type="warning" text-color="white" :disabled="isReplayFinished" @click="doPause">
          {{ recordPaused ? '取消暂停' : '暂停回放' }}
        </n-button>
        <n-button type="error" text-color="white" @click="goBack">
          返回
        </n-button>
      </div>
    </div>
    <div flex-x-center gap-x-5vw xl:gap-x-3 pt-3vh>
      <GameMap ref="refGameMap" h-60vh w-40vw lt-md="!w-60vw" />
      <div v-if="props.playerInfoList?.length" w-300px ha lt-md:hidden flex-y-center mb15vh>
        <n-card hoverable flex="col center" w-full :content-style="{ padding: '10px 20px', width: '100%' }">
          <div text="24px center" font="bold italic">
            对局信息
          </div>
          <div flex justify-between items-center w-full mt-10px>
            <PlayerInfoCard :player="props.playerInfoList[0]" color="#4876EC" side="蓝方" />
            <div w80px text="50px yellow center" font="bold italic game">
              VS
            </div>
            <PlayerInfoCard :player="props.playerInfoList[1]" color="#F94848" side="红方" />
          </div>
          <GameResult :result="gameResult" />
        </n-card>
      </div>
    </div>
  </div>
</template>
