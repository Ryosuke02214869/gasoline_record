<template>
  <div class="fuel-record-list-container">
    <div class="page-header">
      <div class="header-left">
        <Button
          icon="pi pi-home"
          label="ホーム"
          @click="$router.push('/')"
          severity="secondary"
          outlined
        />
        <h1>給油記録</h1>
      </div>
      <Button
        label="新しい記録を登録"
        icon="pi pi-plus"
        @click="$router.push('/fuel-records/create')"
        size="large"
      />
    </div>

    <Card class="filter-card">
      <template #content>
        <div class="filter-section">
          <label for="vehicle-select">車両で絞り込み</label>
          <Select
            id="vehicle-select"
            v-model="selectedVehicleId"
            :options="vehicleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="すべての車両"
            class="vehicle-select"
            @change="handleVehicleChange"
          />
        </div>
      </template>
    </Card>

    <div v-if="fuelRecordStore.loading" class="loading-container">
      <ProgressSpinner />
      <p>読み込み中...</p>
    </div>

    <div v-else-if="displayedRecords.length === 0" class="empty-state">
      <Card>
        <template #content>
          <div class="empty-content">
            <i class="pi pi-book" style="font-size: 4rem; color: #999"></i>
            <h2>給油記録がありません</h2>
            <p>「新しい記録を登録」ボタンから給油記録を登録してください</p>
            <Button
              label="記録を登録する"
              icon="pi pi-plus"
              @click="$router.push('/fuel-records/create')"
              size="large"
              class="mt-3"
            />
          </div>
        </template>
      </Card>
    </div>

    <Card v-else class="table-card">
      <template #content>
        <DataTable
          :value="displayedRecords"
          stripedRows
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          responsiveLayout="scroll"
          class="fuel-table"
        >
          <Column field="date" header="日付" :sortable="true">
            <template #body="{ data }">
              {{ formatDate(data.date) }}
            </template>
          </Column>
          <Column field="vehicles.name" header="車両" :sortable="true">
            <template #body="{ data }">
              <div class="vehicle-cell">
                <strong>{{ data.vehicles?.name }}</strong>
                <br />
                <small>{{ data.vehicles?.license_plate }}</small>
              </div>
            </template>
          </Column>
          <Column field="fuel_amount" header="給油量(L)" :sortable="true">
            <template #body="{ data }">
              {{ data.fuel_amount.toFixed(2) }}
            </template>
          </Column>
          <Column field="price_per_liter" header="単価(円/L)" :sortable="true">
            <template #body="{ data }">
              {{ data.price_per_liter.toFixed(2) }}
            </template>
          </Column>
          <Column field="total_cost" header="給油金額(円)" :sortable="true">
            <template #body="{ data }">
              {{ formatCurrency(data.total_cost) }}
            </template>
          </Column>
          <Column field="odometer" header="走行距離(km)" :sortable="true">
            <template #body="{ data }">
              {{ formatNumber(data.odometer) }}
            </template>
          </Column>
          <Column field="distance_from_previous" header="前回から(km)" :sortable="true">
            <template #body="{ data }">
              {{ data.distance_from_previous ? formatNumber(data.distance_from_previous) : '-' }}
            </template>
          </Column>
          <Column field="fuel_efficiency" header="燃費(km/L)" :sortable="true">
            <template #body="{ data }">
              <span v-if="data.fuel_efficiency" class="fuel-efficiency">
                {{ data.fuel_efficiency.toFixed(2) }}
              </span>
              <span v-else>-</span>
            </template>
          </Column>
          <Column header="操作" :exportable="false" style="min-width: 10rem">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  icon="pi pi-pencil"
                  rounded
                  outlined
                  severity="info"
                  @click="$router.push(`/fuel-records/${data.id}/edit`)"
                  v-tooltip.top="'編集'"
                />
                <Button
                  icon="pi pi-trash"
                  rounded
                  outlined
                  severity="danger"
                  @click="confirmDelete(data)"
                  v-tooltip.top="'削除'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- 削除確認ダイアログ -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      header="給油記録の削除"
      :modal="true"
      :closable="true"
      :style="{ width: '90vw', maxWidth: '500px' }"
    >
      <div class="dialog-content">
        <p>この給油記録を削除してもよろしいですか？</p>
        <div v-if="recordToDelete" class="delete-info">
          <strong>{{ formatDate(recordToDelete.date) }}</strong>
          <br />
          <span>{{ recordToDelete.vehicles?.name }} - 給油量: {{ recordToDelete.fuel_amount }}L</span>
        </div>
        <Message severity="warn" :closable="false" class="mt-3">
          この操作は取り消せません。
        </Message>
      </div>
      <template #footer>
        <Button label="キャンセル" @click="deleteDialogVisible = false" severity="secondary" />
        <Button
          label="削除する"
          @click="handleDelete"
          severity="danger"
          :loading="fuelRecordStore.loading"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFuelRecordStore, type FuelRecord } from '@/stores/fuelRecord'
import { useVehicleStore } from '@/stores/vehicle'
import Button from 'primevue/button'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Tooltip from 'primevue/tooltip'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const fuelRecordStore = useFuelRecordStore()
const vehicleStore = useVehicleStore()
const toast = useToast()

const selectedVehicleId = ref<string | null>(null)
const deleteDialogVisible = ref(false)
const recordToDelete = ref<FuelRecord | null>(null)

const vehicleOptions = computed(() => {
  return [
    { label: 'すべての車両', value: null },
    ...vehicleStore.vehicles.map((v) => ({
      label: `${v.name} (${v.license_plate})`,
      value: v.id,
    })),
  ]
})

const displayedRecords = computed(() => {
  if (!selectedVehicleId.value) {
    return fuelRecordStore.records
  }
  return fuelRecordStore.recordsByVehicle(selectedVehicleId.value)
})

onMounted(async () => {
  try {
    // 車両リストを取得
    if (vehicleStore.vehicles.length === 0) {
      await vehicleStore.fetchVehicles()
    }
    // 給油記録を取得
    await fuelRecordStore.fetchRecords()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: 'データの取得に失敗しました',
      life: 3000,
    })
  }
})

const handleVehicleChange = async () => {
  // フィルタリングはcomputedで自動的に行われる
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return '-'
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('ja-JP').format(value)
}

const confirmDelete = (record: FuelRecord) => {
  recordToDelete.value = record
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (!recordToDelete.value) return

  try {
    await fuelRecordStore.deleteRecord(recordToDelete.value.id)
    toast.add({
      severity: 'success',
      summary: '成功',
      detail: '給油記録を削除しました',
      life: 3000,
    })
    deleteDialogVisible.value = false
    recordToDelete.value = null
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'エラー',
      detail: '給油記録の削除に失敗しました',
      life: 3000,
    })
  }
}
</script>

<style scoped>
.fuel-record-list-container {
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

.filter-card {
  margin-bottom: 2rem;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-section label {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
}

.vehicle-select {
  width: 100%;
  max-width: 400px;
  font-size: 1.1rem;
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

.table-card {
  font-size: 1rem;
}

.fuel-table :deep(.p-datatable-thead > tr > th) {
  font-size: 1rem;
  font-weight: 600;
}

.fuel-table :deep(.p-datatable-tbody > tr > td) {
  font-size: 1rem;
}

.vehicle-cell {
  line-height: 1.5;
}

.vehicle-cell strong {
  color: #333;
}

.vehicle-cell small {
  color: #666;
}

.fuel-efficiency {
  font-weight: 600;
  color: #667eea;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
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
  font-size: 1rem;
}

/* PC画面（1200px以上） */
@media (min-width: 1200px) {
  .fuel-record-list-container {
    max-width: 1400px;
  }
}

/* タブレット画面（768px〜1199px） */
@media (min-width: 768px) and (max-width: 1199px) {
  .fuel-record-list-container {
    max-width: 900px;
  }
}

/* スマホ画面（768px未満） */
@media (max-width: 767px) {
  .fuel-record-list-container {
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

  .vehicle-select {
    max-width: 100%;
  }

  .fuel-table :deep(.p-datatable-thead > tr > th),
  .fuel-table :deep(.p-datatable-tbody > tr > td) {
    font-size: 0.9rem;
  }
}
</style>
