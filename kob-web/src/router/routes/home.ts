import BaseLayout from '~/layout/default.vue';

export default {
  path: '/home',
  component: BaseLayout,
  children: [
    {
      path: '',
      name: 'Home',
      component: () => import('~/pages/home/index.vue'),
      meta: {
        title: '首页',
        requiresAuth: false,
      },
    },
  ],
};
