<script setup lang="ts">
import type { Discuss } from '~/types';
import DiscussItem from './components/DiscussItem.vue';
import DiscussSubmitForm from './components/DiscussSubmitForm.vue';

const pagination = usePagination({
  onChangeCallback: fetchDiscussList,
  onUpdatePageSizeCallback: fetchDiscussList,
});

const { loading, startLoading, endLoading } = useLoading();

const list = ref<Discuss[]>([]);
const likes = ref<number[]>([]);

const defaultLoadingData = [{ id: 1 }, { id: 2 }, { id: 3 }];

async function fetchDiscussList() {
  startLoading();
  list.value = [...defaultLoadingData];
  const { page, pageSize } = pagination;
  try {
    const result = await DiscussApi.getDiscussList({ page, pageSize });
    const { data: { records = [], total = 0 } } = result.data;
    list.value = records;
    pagination.itemCount = total;
  } catch (e) {
    console.error(e);
    list.value = [];
  } finally {
    endLoading();
  }
}

async function fetchCurrentUserLikes() {
  try {
    const { data: { data = [] } } = await DiscussApi.getCurrentUserLikes();
    likes.value = data;
  } catch (e) {
    console.error(e);
    likes.value = [];
  }
}

const getAuthLike = (remarkId?: number) => !!remarkId && likes.value.includes(remarkId);

function likeCallback({ id, type }: { id?: number, type: 'like' | 'dislike' }) {
  if (!id)
    return;
  fetchCurrentUserLikes();
  const item = list.value.find(i => i.id === id);
  if (item?.likes !== undefined) {
    item.likes += type === 'like' ? 1 : -1;
  }
}

onMounted(() => {
  fetchDiscussList();
  fetchCurrentUserLikes();
});
</script>

<template>
  <div w-70vw mx-a flex="~ col">
    <n-card>
      <div text="1.6rem center" font-800 mb10px>
        我要提 Bug ！！！(╯▔皿▔)╯
      </div>
      <n-alert title="意见栏" type="info">
        @Everyone：欢迎小伙伴们留下自己的建议，如果有时间我会持续完善的。
      </n-alert>

      <div mt20px>
        <n-list bordered clickable>
          <n-list-item>
            <DiscussSubmitForm @refresh="fetchDiscussList" />
          </n-list-item>
          <n-list-item v-for="item in list" :key="item.id">
            <DiscussItem
              :item="item"
              :loading="loading"
              :is-auth-like="getAuthLike(item?.id)"
              @like-callback="likeCallback"
            />
          </n-list-item>
        </n-list>
        <div v-if="list.length > 0" mt10px flex justify-end>
          <n-pagination
            :page="pagination.page"
            :item-count="pagination.itemCount"
            :page-sizes="pagination.pageSizes"
            :page-size="pagination.pageSize"
            :show-size-picker="pagination.showSizePicker"
            :on-update:page="pagination.onChange"
            :on-update:page-size="pagination.onUpdatePageSize"
          />
        </div>
      </div>
    </n-card>
  </div>
</template>
