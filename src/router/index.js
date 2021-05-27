import Vue from 'vue';
import VueRouter from 'vue-router';
import RSA from '../views/RSA.vue';
import TDES from '../views/TDES.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/TDES'
  },
  {
    path: '/TDES',
    name: 'TDES',
    component: TDES,
  },
  {
    path: '/RSA',
    name: 'RSA',
    component: RSA
  },
];

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes,
});

export default router;
