import Vue from 'vue';
import axios from 'axios';

import { MdButton, MdContent, MdTabs, MdIcon, MdCard, MdDialogAlert, MdDialog, MdProgress } from 'vue-material/dist/components';
import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/default.css';
import '@/styles/index.scss';
import '@/styles/material-icons.css';

import App from './App';
import router from './router';


Vue.use(MdButton);
Vue.use(MdContent);
Vue.use(MdTabs);
Vue.use(MdIcon);
Vue.use(MdCard);
Vue.use(MdDialogAlert);
Vue.use(MdProgress);
Vue.use(MdDialog);

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
const service = axios.create({
  baseURL: 'https://aip.baidubce.com/rest/2.0/ocr/v1/',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});
Vue.http = Vue.prototype.$http = service;
Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  template: '<App/>',
}).$mount('#app');
