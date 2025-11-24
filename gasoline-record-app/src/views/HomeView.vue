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
      <div class="header-brand">
        <div class="brand-icon">
          <i class="pi pi-car"></i>
        </div>
        <h1>ガソリン管理システム</h1>
      </div>
      <Button
        label="ログアウト"
        icon="pi pi-sign-out"
        @click="handleLogout"
        text
        class="logout-button"
      />
    </header>

    <main class="main-content">
      <div class="page-title">
        <h2>メニュー</h2>
      </div>

      <div class="menu-grid">
        <Card class="menu-card" @click="$router.push('/vehicles')">
          <template #content>
            <div class="menu-content">
              <div class="icon-badge primary">
                <i class="pi pi-car"></i>
              </div>
              <h3>車両登録</h3>
              <p>車両の登録・管理を行います</p>
            </div>
          </template>
        </Card>

        <Card class="menu-card" @click="$router.push('/fuel-records')">
          <template #content>
            <div class="menu-content">
              <div class="icon-badge secondary">
                <i class="pi pi-book"></i>
              </div>
              <h3>給油記録</h3>
              <p>給油情報の記録・確認</p>
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
  background: var(--vt-c-bg-lavender);
}

.app-header {
  background: transparent;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: var(--vt-c-primary);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.app-header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vt-c-text-primary);
}

.logout-button {
  color: var(--vt-c-text-secondary);
}

.main-content {
  padding: 0 2rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  text-align: center;
  margin-bottom: 2rem;
}

.page-title h2 {
  font-size: 1.125rem;
  font-weight: 400;
  color: var(--vt-c-text-secondary);
  margin: 0;
}

.menu-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
  max-width: 400px;
  margin: 0 auto;
}

.menu-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 20px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.menu-card :deep(.p-card-content) {
  padding: 2rem 1.5rem;
}

.menu-content {
  text-align: center;
}

.menu-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--vt-c-text-primary);
  margin: 0 0 0.5rem;
}

.menu-content p {
  color: var(--vt-c-text-secondary);
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

/* PC画面（768px以上） */
@media (min-width: 768px) {
  .menu-grid {
    grid-template-columns: repeat(2, 1fr);
    max-width: 800px;
  }
}

/* スマホ画面（768px未満） */
@media (max-width: 767px) {
  .app-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    align-items: flex-start;
  }

  .header-brand {
    width: 100%;
  }

  .app-header h1 {
    font-size: 1.125rem;
  }

  .logout-button {
    align-self: flex-end;
  }

  .main-content {
    padding: 0 1rem 1rem;
  }

  .menu-grid {
    max-width: 100%;
  }
}
</style>
