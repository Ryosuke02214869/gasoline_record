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
          <br />
          <p><strong>次の機能を実装予定：</strong></p>
          <ul>
            <li>車両の登録・管理</li>
            <li>給油記録の登録・編集・削除</li>
            <li>燃費の自動計算</li>
            <li>給油履歴の一覧表示</li>
          </ul>
        </template>
      </Card>
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
