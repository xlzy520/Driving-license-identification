import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      component: require('@/views/home').default,
      children: [
        {
          path: '',
          redirect: 'driving-license',
        },
        {
          path: 'driving-license',
          component: require('@/components/drivingLicense').default,
        },
      ],
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
