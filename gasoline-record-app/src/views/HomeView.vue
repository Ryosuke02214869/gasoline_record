<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import Card from 'primevue/card'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  try {
    await authStore.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<template>
  <div class="home-container">
    <header class="app-header">
      <h1>ガソリン給油記録アプリ</h1>
      <div class="user-info">
        <span class="user-email">{{ authStore.user?.email }}</span>
        <Button label="ログアウト" icon="pi pi-sign-out" @click="handleLogout" severity="secondary" />
      </div>
    </header>

    <main class="main-content">
      <Card class="welcome-card">
        <template #title>ようこそ！</template>
        <template #content>
          <p>ガソリン給油記録アプリへようこそ。</p>
          <p>このアプリでは、給油記録の管理と燃費の計算ができます。</p>
        </template>
      </Card>

      <div class="menu-grid">
        <Card class="menu-card" @click="$router.push('/vehicles')">
          <template #content>
            <div class="menu-content">
              <i class="pi pi-car menu-icon"></i>
              <h2>車両管理</h2>
              <p>車両の登録・編集・削除</p>
            </div>
          </template>
        </Card>

        <Card class="menu-card disabled">
          <template #content>
            <div class="menu-content">
              <i class="pi pi-book menu-icon"></i>
              <h2>給油記録</h2>
              <p>給油記録の登録・管理</p>
              <span class="coming-soon">準備中</span>
            </div>
          </template>
        </Card>

        <Card class="menu-card disabled">
          <template #content>
            <div class="menu-content">
              <i class="pi pi-chart-line menu-icon"></i>
              <h2>燃費分析</h2>
              <p>燃費の自動計算と表示</p>
              <span class="coming-soon">準備中</span>
            </div>
          </template>
        </Card>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-email {
  font-size: 1rem;
  font-weight: 500;
}

.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  font-size: 1.1rem;
}

.welcome-card :deep(.p-card-title) {
  font-size: 2rem;
  color: #667eea;
}

.welcome-card :deep(.p-card-content) p {
  margin-bottom: 0.5rem;
}

.welcome-card :deep(.p-card-content) ul {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
}

.welcome-card :deep(.p-card-content) li {
  margin-bottom: 0.5rem;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.menu-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-card:not(.disabled):hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.menu-card.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.menu-content {
  text-align: center;
  padding: 2rem 1rem;
  position: relative;
}

.menu-icon {
  font-size: 4rem;
  color: #667eea;
  margin-bottom: 1rem;
}

.menu-content h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem;
}

.menu-content p {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.coming-soon {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  color: #999;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .app-header h1 {
    font-size: 1.5rem;
  }

  .user-info {
    width: 100%;
    justify-content: space-between;
  }

  .main-content {
    padding: 1rem;
  }
}
</style>
