import type { RouteLocationNormalized } from 'vue-router';
import BaseLayout from '~/layout/default.vue';

export default {
  path: '/record/video',
  component: BaseLayout,
  children: [
    {
      path: ':id?',
      name: 'RecordVideo',
      component: () => import('~/pages/record-video/index.vue'),
      meta: {
        title: '对局记录',
        requiresAuth: true,
      },
      props: (route: RouteLocationNormalized) => ({
        id: route.params.id,
        page: Number(route.query.page) || 1,
        pageSize: Number(route.query.pageSize) || 10,
        name: route.query.name || '',
      }),
    },
  ],
};
