<script setup lang="ts">
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  TrashBinOutline as TrashBinOutlineIcon,
} from '@vicons/ionicons5';
import type { Record } from '~/types';
import { createColumns } from './utils/columns';

const props = withDefaults(defineProps<{
  page?: number
  pageSize?: number
  name?: string
}>(), {
  page: 1,
  pageSize: 10,
  name: '',
});

const router = useRouter();
const userStore = useUserStore();
const { loading, startLoading, endLoading } = useLoading();

const tableData = ref<Record[]>([]);
const searchModel = reactive({ name: props.name });

const pagination = usePagination({
  page: props.page,
  pageSize: props.pageSize,
  onChangeCallback: fetchTableData,
  onUpdatePageSizeCallback: fetchTableData,
});

function canDelete(aId: number, bId: number): boolean {
  const userId = userStore.user?.id;
  return userId === aId || userId === bId;
}

function onRemoveRecord({ id }: Record) {
  try {
    useConfirm('你确定要删除该对局吗？', async () => {
      const result = await RecordApi.deleteRecord(id as number);
      const { code, msg } = result.data;
      if (code !== 0) {
        $message.error(msg || '删除失败');
        return;
      }
      $message.success('删除成功');
      fetchTableData();
    });
  } catch (e) {
    console.error(e);
    $message.error('删除失败');
  }
}

async function fetchTableData() {
  startLoading();
  const { page, pageSize } = pagination;
  try {
    const result = await RecordApi.getRecordList({ page, pageSize, name: searchModel.name?.trim() });
    const { records = [], total = 0 } = result.data.data;
    tableData.value = records;
    pagination.itemCount = total;
  } catch (e) {
    console.error(e);
    tableData.value = [];
    pagination.itemCount = 0;
  } finally {
    endLoading();
  }
}

function checkVideo({ id }: Record) {
  router.push({
    path: `/record/video/${id}`,
    query: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      name: searchModel.name,
    },
  });
}

const columns = createColumns({
  createRowNumber: pagination.createRowNumber,
  canDelete,
  checkVideo,
  onRemoveRecord,
});

const { isMobile } = useResponsive();

function reset() {
  searchModel.name = '';
  fetchTableData();
}

onMounted(fetchTableData);
</script>

<template>
  <div w-full>
    <n-card title="对局记录" hoverable>
      <template v-if="!isMobile" #header-extra>
        <div flex gap-x-2>
          <n-form-item label="玩家名称" label-placement="left" :show-feedback="false">
            <n-input v-model:value="searchModel.name" placeholder="玩家名称" clearable :style="{ width: '150px' }">
              <template #clear-icon>
                <n-icon :component="TrashBinOutlineIcon" />
              </template>
            </n-input>
          </n-form-item>
          <n-button type="primary" text-color="white" @click="fetchTableData">
            <template #icon>
              <n-icon :component="SearchIcon" color="white" />
            </template>
            <span font-bold>查询</span>
          </n-button>
          <n-button secondary @click="reset">
            <template #icon>
              <n-icon :component="RefreshIcon" />
            </template>
            <span font-bold>重置</span>
          </n-button>
        </div>
      </template>
      <n-data-table
        v-if="!isMobile"
        size="small"
        :loading="loading"
        :columns="columns"
        :data="tableData"
        :remote="true"
        :pagination="pagination"
        :paginate-single-page="false"
      />
      <div
        v-else
        hw-full
        flex-center
        text-lg
      >
        {  请在客户端访问 :). }
      </div>
    </n-card>
  </div>
</template>
