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

    <!-- PC/タブレット用のテーブル表示 -->
    <Card v-else class="table-card desktop-table">
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

    <!-- スマホ用のリスト表示 -->
    <div v-if="displayedRecords.length > 0" class="mobile-list">
      <Card
        v-for="record in displayedRecords"
        :key="record.id"
        class="mobile-record-card"
        @click="showRecordDetail(record)"
      >
        <template #content>
          <div class="mobile-record-content">
            <div class="record-row">
              <span class="record-label">日付</span>
              <span class="record-value">{{ formatDate(record.date) }}</span>
            </div>
            <div class="record-row">
              <span class="record-label">給油量</span>
              <span class="record-value highlight">{{ record.fuel_amount.toFixed(2) }} L</span>
            </div>
            <div class="record-row">
              <span class="record-label">走行距離</span>
              <span class="record-value">{{ formatNumber(record.odometer) }} km</span>
            </div>
            <div class="record-tap-hint">
              <i class="pi pi-angle-right"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- 詳細表示ダイアログ（スマホ用） -->
    <Dialog
      v-model:visible="detailDialogVisible"
      header="給油記録の詳細"
      :modal="true"
      :closable="true"
      :style="{ width: '90vw', maxWidth: '500px' }"
    >
      <div v-if="selectedRecord" class="detail-content">
        <div class="detail-row">
          <span class="detail-label">日付</span>
          <span class="detail-value">{{ formatDate(selectedRecord.date) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">車両</span>
          <div class="detail-value">
            <strong>{{ selectedRecord.vehicles?.name }}</strong>
            <br />
            <small>{{ selectedRecord.vehicles?.license_plate }}</small>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">給油量</span>
          <span class="detail-value">{{ selectedRecord.fuel_amount.toFixed(2) }} L</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">単価</span>
          <span class="detail-value">{{ selectedRecord.price_per_liter.toFixed(2) }} 円/L</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">給油金額</span>
          <span class="detail-value">{{ formatCurrency(selectedRecord.total_cost) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">走行距離</span>
          <span class="detail-value">{{ formatNumber(selectedRecord.odometer) }} km</span>
        </div>
        <div v-if="selectedRecord.distance_from_previous" class="detail-row">
          <span class="detail-label">前回から</span>
          <span class="detail-value">{{ formatNumber(selectedRecord.distance_from_previous) }} km</span>
        </div>
        <div v-if="selectedRecord.fuel_efficiency" class="detail-row">
          <span class="detail-label">燃費</span>
          <span class="detail-value highlight">{{ selectedRecord.fuel_efficiency.toFixed(2) }} km/L</span>
        </div>
      </div>
      <template #footer>
        <div class="detail-actions">
          <Button
            label="編集"
            icon="pi pi-pencil"
            @click="$router.push(`/fuel-records/${selectedRecord?.id}/edit`)"
            severity="info"
            outlined
          />
          <Button
            label="削除"
            icon="pi pi-trash"
            @click="confirmDelete(selectedRecord!)"
            severity="danger"
            outlined
          />
        </div>
      </template>
    </Dialog>

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
const detailDialogVisible = ref(false)
const selectedRecord = ref<FuelRecord | null>(null)

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

const showRecordDetail = (record: FuelRecord) => {
  selectedRecord.value = record
  detailDialogVisible.value = true
}

const confirmDelete = (record: FuelRecord) => {
  recordToDelete.value = record
  deleteDialogVisible.value = true
  detailDialogVisible.value = false
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
  min-height: 100vh;
  background: var(--vt-c-bg-lavender);
  padding: 1.5rem;
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
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vt-c-text-primary);
  margin: 0;
}

.page-header :deep(.p-button) {
  background: var(--vt-c-secondary);
  border: none;
  border-radius: 12px;
  padding: 0.625rem 1.25rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.page-header :deep(.p-button:hover) {
  background: var(--vt-c-secondary-dark);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.header-left :deep(.p-button) {
  background: var(--vt-c-primary);
  border: none;
  color: #FFFFFF;
  border-radius: 12px;
  padding: 0.625rem 1.25rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(91, 95, 237, 0.2);
}

.header-left :deep(.p-button:hover) {
  background: var(--vt-c-primary-dark);
  box-shadow: 0 4px 12px rgba(91, 95, 237, 0.3);
}

.filter-card {
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.filter-card :deep(.p-card) {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-section label {
  font-weight: 600;
  color: var(--vt-c-text-primary);
  font-size: 0.875rem;
}

.vehicle-select {
  width: 100%;
  font-size: 1rem;
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
  max-width: 400px;
  margin: 2rem auto;
}

.empty-state :deep(.p-card) {
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 2rem;
}

.empty-content i {
  color: var(--vt-c-text-tertiary);
}

.empty-content h2 {
  margin: 1rem 0 0.5rem;
  color: var(--vt-c-text-primary);
  font-size: 1.125rem;
  font-weight: 600;
}

.empty-content p {
  color: var(--vt-c-text-secondary);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.empty-content :deep(.p-button) {
  background: var(--vt-c-secondary);
  border: none;
  border-radius: 12px;
  padding: 0.625rem 1.25rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.table-card {
  max-width: 1200px;
  margin: 0 auto;
}

.table-card :deep(.p-card) {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.fuel-table :deep(.p-datatable-thead > tr > th) {
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--vt-c-bg-lavender);
  color: var(--vt-c-text-primary);
}

.fuel-table :deep(.p-datatable-tbody > tr > td) {
  font-size: 0.875rem;
  color: var(--vt-c-text-secondary);
}

.vehicle-cell {
  line-height: 1.5;
}

.vehicle-cell strong {
  color: var(--vt-c-text-primary);
}

.vehicle-cell small {
  color: var(--vt-c-text-tertiary);
}

.fuel-efficiency {
  font-weight: 600;
  color: var(--vt-c-primary);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

/* スマホ用のリスト表示（デフォルトでは非表示） */
.mobile-list {
  display: none;
}

.mobile-record-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mobile-record-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.mobile-record-content {
  position: relative;
  padding: 0.5rem 0;
}

.record-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--vt-c-divider-light-2);
}

.record-row:last-child {
  border-bottom: none;
}

.record-label {
  font-size: 0.875rem;
  color: var(--vt-c-text-secondary);
  font-weight: 600;
}

.record-value {
  font-size: 0.875rem;
  color: var(--vt-c-text-primary);
  font-weight: 500;
}

.record-value.highlight {
  color: var(--vt-c-secondary);
  font-weight: 600;
  font-size: 1rem;
}

.record-tap-hint {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  color: var(--vt-c-text-tertiary);
  font-size: 1.25rem;
}

/* 詳細表示ダイアログ */
.detail-content {
  padding: 0.5rem 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--vt-c-divider-light-2);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 0.875rem;
  color: var(--vt-c-text-secondary);
  font-weight: 600;
  min-width: 100px;
}

.detail-value {
  font-size: 0.875rem;
  color: var(--vt-c-text-primary);
  text-align: right;
}

.detail-value.highlight {
  color: var(--vt-c-primary);
  font-weight: 600;
  font-size: 1rem;
}

.detail-value strong {
  color: var(--vt-c-text-primary);
}

.detail-value small {
  color: var(--vt-c-text-tertiary);
}

.detail-actions {
  display: flex;
  gap: 0.75rem;
}

.detail-actions button {
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
  font-size: 1rem;
}

/* PC画面（768px以上） */
@media (min-width: 768px) {
  .fuel-record-list-container {
    padding: 2rem;
  }

  .filter-card {
    max-width: 700px;
  }

  .table-card {
    max-width: 1400px;
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
    flex-direction: row;
    align-items: center;
  }

  .page-header h1 {
    font-size: 1.125rem;
  }

  .filter-card {
    max-width: 100%;
  }

  .vehicle-select {
    max-width: 100%;
  }

  /* スマホではテーブルを非表示にしてリスト表示 */
  .desktop-table {
    display: none;
  }

  .mobile-list {
    display: block;
  }
}
</style>
