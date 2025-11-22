import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Ref, ComputedRef } from 'vue'

export interface FuelRecord {
  id: string
  vehicle_id: string
  date: string
  fuel_amount: number
  price_per_liter: number
  odometer: number
  created_at: string
  updated_at: string
  // リレーション
  vehicles?: {
    name: string
    license_plate: string
  }
  // 計算フィールド
  total_cost?: number
  distance_from_previous?: number | null
  fuel_efficiency?: number | null
}

export interface FuelRecordStore {
  records: Ref<FuelRecord[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  recordsByVehicle: ComputedRef<(vehicleId: string) => FuelRecord[]>
  fetchRecords: (vehicleId?: string) => Promise<void>
  createRecord: (
    vehicleId: string,
    date: string,
    fuelAmount: number,
    pricePerLiter: number,
    odometer: number,
  ) => Promise<FuelRecord | null>
  updateRecord: (
    id: string,
    vehicleId: string,
    date: string,
    fuelAmount: number,
    pricePerLiter: number,
    odometer: number,
  ) => Promise<FuelRecord | null>
  deleteRecord: (id: string) => Promise<void>
  clearError: () => void
}

export const useFuelRecordStore = defineStore('fuelRecord', () => {
  // State
  const records = ref<FuelRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const recordsByVehicle = computed(() => {
    return (vehicleId: string) => {
      return records.value.filter((r) => r.vehicle_id === vehicleId)
    }
  })

  // Actions
  async function fetchRecords(vehicleId?: string) {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('fuel_records')
        .select(
          `
          *,
          vehicles (
            name,
            license_plate
          )
        `,
        )
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      // 燃費計算を追加
      const recordsWithCalculations = calculateFuelEfficiency(data || [])
      records.value = recordsWithCalculations
    } catch (err: any) {
      console.error('Error fetching fuel records:', err)
      error.value = err.message || '給油記録の取得に失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createRecord(
    vehicleId: string,
    date: string,
    fuelAmount: number,
    pricePerLiter: number,
    odometer: number,
  ) {
    if (!vehicleId || vehicleId.trim() === '') {
      throw new Error('車両IDが指定されていません')
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('fuel_records')
        .insert({
          vehicle_id: vehicleId,
          date,
          fuel_amount: fuelAmount,
          price_per_liter: pricePerLiter,
          odometer,
        })
        .select(
          `
          *,
          vehicles (
            name,
            license_plate
          )
        `,
        )
        .single()

      if (createError) {
        throw createError
      }

      // リストに追加して再計算
      if (data) {
        // 車両ごとに日付順にソート
        const vehicleRecords = records.value.filter((r) => r.vehicle_id === vehicleId)
        vehicleRecords.push(data)
        vehicleRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // 燃費を再計算
        const recalculated = calculateFuelEfficiency(vehicleRecords)

        // 元のリストを更新
        records.value = [
          ...recalculated,
          ...records.value.filter((r) => r.vehicle_id !== vehicleId),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }

      return data
    } catch (err: any) {
      console.error('Error creating fuel record:', err)
      error.value = err.message || '給油記録の登録に失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateRecord(
    id: string,
    vehicleId: string,
    date: string,
    fuelAmount: number,
    pricePerLiter: number,
    odometer: number,
  ) {
    if (!vehicleId || vehicleId.trim() === '') {
      throw new Error('車両IDが指定されていません')
    }

    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('fuel_records')
        .update({
          vehicle_id: vehicleId,
          date,
          fuel_amount: fuelAmount,
          price_per_liter: pricePerLiter,
          odometer,
        })
        .eq('id', id)
        .select(
          `
          *,
          vehicles (
            name,
            license_plate
          )
        `,
        )
        .single()

      if (updateError) {
        throw updateError
      }

      // リストを更新して再計算
      if (data) {
        const vehicleRecords = records.value
          .filter((r) => r.vehicle_id === vehicleId && r.id !== id)
          .concat(data)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const recalculated = calculateFuelEfficiency(vehicleRecords)

        records.value = [
          ...recalculated,
          ...records.value.filter((r) => r.vehicle_id !== vehicleId),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }

      return data
    } catch (err: any) {
      console.error('Error updating fuel record:', err)
      error.value = err.message || '給油記録の更新に失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteRecord(id: string) {
    loading.value = true
    error.value = null

    try {
      const recordToDelete = records.value.find((r) => r.id === id)
      if (!recordToDelete) {
        throw new Error('削除対象の記録が見つかりません')
      }

      const { error: deleteError } = await supabase.from('fuel_records').delete().eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      // リストから削除して再計算
      const vehicleId = recordToDelete.vehicle_id
      const vehicleRecords = records.value
        .filter((r) => r.vehicle_id === vehicleId && r.id !== id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const recalculated = calculateFuelEfficiency(vehicleRecords)

      records.value = [
        ...recalculated,
        ...records.value.filter((r) => r.vehicle_id !== vehicleId),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (err: any) {
      console.error('Error deleting fuel record:', err)
      error.value = err.message || '給油記録の削除に失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 燃費計算関数
  function calculateFuelEfficiency(recordsList: FuelRecord[]): FuelRecord[] {
    if (recordsList.length === 0) return []

    // 日付順にソート（古い順）
    const sorted = [...recordsList].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    return sorted.map((record, index) => {
      // 給油金額の計算
      const total_cost = record.fuel_amount * record.price_per_liter

      // 最初の記録の場合は前回からの計算ができない
      if (index === 0) {
        return {
          ...record,
          total_cost,
          distance_from_previous: null,
          fuel_efficiency: null,
        }
      }

      // 前回の記録
      const previousRecord = sorted[index - 1]

      // 前回の記録がない場合
      if (!previousRecord) {
        return {
          ...record,
          total_cost,
          distance_from_previous: null,
          fuel_efficiency: null,
        }
      }

      // 前回からの走行距離
      const distance_from_previous = record.odometer - previousRecord.odometer

      // 燃費（km/L）
      const fuel_efficiency =
        distance_from_previous > 0 ? distance_from_previous / record.fuel_amount : null

      return {
        ...record,
        total_cost,
        distance_from_previous,
        fuel_efficiency,
      }
    })
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    records,
    loading,
    error,
    // Getters
    recordsByVehicle,
    // Actions
    fetchRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    clearError,
  }
})
