import type { RouteLocationNormalized } from 'vue-router';
import BaseLayout from '~/layout/default.vue';

export default {
  path: '/record',
  component: BaseLayout,
  children: [
    {
      path: '',
      name: 'Record',
      component: () => import('~/pages/record/index.vue'),
      meta: {
        title: '对局记录',
        requiresAuth: true,
      },
      props: (route: RouteLocationNormalized) => ({
        page: Number(route.query.page) || 1,
        pageSize: Number(route.query.pageSize) || 10,
        name: route.query.name || '',
      }),
    },
  ],
};
