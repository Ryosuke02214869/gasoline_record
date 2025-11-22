import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/vehicles',
      name: 'vehicles',
      component: () => import('../views/VehicleListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/vehicles/create',
      name: 'vehicle-create',
      component: () => import('../views/VehicleCreateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/vehicles/:id/edit',
      name: 'vehicle-edit',
      component: () => import('../views/VehicleEditView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/fuel-records',
      name: 'fuel-records',
      component: () => import('../views/FuelRecordListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/fuel-records/create',
      name: 'fuel-record-create',
      component: () => import('../views/FuelRecordCreateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/fuel-records/:id/edit',
      name: 'fuel-record-edit',
      component: () => import('../views/FuelRecordEditView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// ルートガード
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 認証が必要なページ
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // 未認証の場合はログイン画面へリダイレクト
      next({ name: 'login' })
    } else {
      next()
    }
  }
  // ゲスト専用ページ（ログイン・新規登録）
  else if (to.meta.requiresGuest) {
    if (authStore.isAuthenticated) {
      // 認証済みの場合はホーム画面へリダイレクト
      next({ name: 'home' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
