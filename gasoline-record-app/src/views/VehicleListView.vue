<template>
  <div class="vehicle-list-container">
    <div class="page-header">
      <div class="header-left">
        <Button
          icon="pi pi-home"
          label="ホーム"
          @click="$router.push('/')"
          severity="secondary"
          outlined
        />
        <h1>車両管理</h1>
      </div>
      <Button
        label="新しい車両を登録"
        icon="pi pi-plus"
        @click="$router.push('/vehicles/create')"
        size="large"
      />
    </div>

    <div v-if="vehicleStore.loading" class="loading-container">
      <ProgressSpinner />
      <p>読み込み中...</p>
    </div>

    <div v-else-if="vehicleStore.vehicles.length === 0" class="empty-state">
      <Card>
        <template #content>
          <div class="empty-content">
            <i class="pi pi-car" style="font-size: 4rem; color: #999"></i>
            <h2>登録されている車両がありません</h2>
            <p>「新しい車両を登録」ボタンから車両を登録してください</p>
            <Button
              label="車両を登録する"
              icon="pi pi-plus"
              @click="$router.push('/vehicles/create')"
              size="large"
              class="mt-3"
            />
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="vehicle-grid">
      <Card v-for="vehicle in vehicleStore.vehicles" :key="vehicle.id" class="vehicle-card">
        <template #header>
          <div class="card-header">
            <i class="pi pi-car"></i>
          </div>
        </template>
        <template #title>{{ vehicle.name }}</template>
        <template #subtitle>
          <div class="vehicle-info">
            <span class="license-plate">{{ vehicle.license_plate }}</span>
          </div>
        </template>
        <template #content>
          <div class="vehicle-meta">
            <small>登録日: {{ formatDate(vehicle.created_at) }}</small>
          </div>
        </template>
        <template #footer>
          <div class="card-actions">
            <Button
              label="編集"
              icon="pi pi-pencil"
              @click="$router.push(`/vehicles/${vehicle.id}/edit`)"
              severity="info"
              outlined
            />
            <Button
              label="削除"
              icon="pi pi-trash"
              @click="confirmDelete(vehicle)"
              severity="danger"
              outlined
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- 削除確認ダイアログ -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      header="車両の削除"
      :modal="true"
      :closable="true"
      :style="{ width: '90vw', maxWidth: '500px' }"
    >
      <div class="dialog-content">
        <p>以下の車両を削除してもよろしいですか？</p>
        <div v-if="vehicleToDelete" class="delete-info">
          <strong>{{ vehicleToDelete.name }}</strong>
          <br />
          <span>{{ vehicleToDelete.license_plate }}</span>
        </div>
        <Message severity="warn" :closable="false" class="mt-3">
          この車両に関連する給油記録も全て削除されます。この操作は取り消せません。
        </Message>
      </div>
      <template #footer>
        <Button label="キャンセル" @click="deleteDialogVisible = false" severity="secondary" />
        <Button
          label="削除する"
          @click="handleDelete"
          severity="danger"
          :loading="vehicleStore.loading"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVehicleStore, type Vehicle } from '@/stores/vehicle'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const vehicleStore = useVehicleStore()
const toast = useToast()

const deleteDialogVisible = ref(false)
const vehicleToDelete = ref<Vehicle | null>(null)

onMounted(async () => {
  try {
    await vehicleStore.fetchVehicles()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: '車両の取得に失敗しました',
      life: 3000,
    })
  }
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const confirmDelete = (vehicle: Vehicle) => {
  vehicleToDelete.value = vehicle
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (!vehicleToDelete.value) return

  try {
    await vehicleStore.deleteVehicle(vehicleToDelete.value.id)
    toast.add({
      severity: 'success',
      summary: '成功',
      detail: '車両を削除しました',
      life: 3000,
    })
    deleteDialogVisible.value = false
    vehicleToDelete.value = null
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: '車両の削除に失敗しました',
      life: 3000,
    })
  }
}
</script>

<style scoped>
.vehicle-list-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  gap: 1rem;
}

.empty-state {
  margin-top: 2rem;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 2rem;
}

.empty-content h2 {
  margin: 1rem 0 0.5rem;
  color: #666;
  font-size: 1.5rem;
}

.empty-content p {
  color: #999;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.vehicle-card {
  font-size: 1.1rem;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  font-size: 3rem;
}

.vehicle-card :deep(.p-card-title) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.vehicle-info {
  margin-top: 0.5rem;
}

.license-plate {
  font-size: 1.2rem;
  font-weight: 600;
  color: #667eea;
  font-family: monospace;
}

.vehicle-meta {
  color: #999;
  font-size: 0.95rem;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
}

.card-actions button {
  flex: 1;
}

.dialog-content {
  padding: 1rem 0;
}

.dialog-content p {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.delete-info {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1.1rem;
}

/* PC画面（1200px以上） */
@media (min-width: 1200px) {
  .vehicle-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

/* タブレット画面（768px〜1199px） */
@media (min-width: 768px) and (max-width: 1199px) {
  .vehicle-list-container {
    max-width: 900px;
  }

  .vehicle-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* スマホ画面（768px未満） */
@media (max-width: 767px) {
  .vehicle-list-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header h1 {
    font-size: 1.5rem;
    text-align: center;
  }

  .vehicle-grid {
    grid-template-columns: 1fr;
  }

  .card-actions {
    flex-direction: column;
  }

  .card-actions button {
    width: 100%;
  }
}
</style>
