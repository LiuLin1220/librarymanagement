<template>
  <div>
    <div class="table-toolbar">
      <el-date-picker
        v-model="selectedMonth"
        type="month"
        value-format="yyyy-MM"
        placeholder="选择月份"
        size="small"
        @change="loadSales"
      />
      <el-button
        type="primary"
        size="small"
        icon="el-icon-search"
        :loading="loading"
        @click="loadSales"
      >
        查询
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="sales"
      stripe
      border
      fit
      empty-text="该月份暂无销售记录"
      :default-sort="{ prop: 'totalSaleQuantity', order: 'descending' }"
    >
      <el-table-column prop="title" label="书名" sortable align="center" />
      <el-table-column prop="author" label="作者" sortable align="center" />
      <el-table-column
        prop="totalSaleQuantity"
        label="月销售数量"
        sortable
        align="center"
      />
      <el-table-column
        prop="totalSaleAmount"
        label="月销售金额"
        sortable
        align="center"
      />
    </el-table>
  </div>
</template>

<script>
import { listMonthlySales } from '../api/books'
import { getApiErrorMessage } from '../api/http'
import { currentYearMonth } from '../utils/date'

export default {
  name: 'BookSaleInfoMonth',
  data() {
    return {
      selectedMonth: currentYearMonth(),
      sales: [],
      loading: false
    }
  },
  created() {
    this.loadSales()
  },
  methods: {
    async loadSales() {
      if (!this.selectedMonth) {
        this.sales = []
        return
      }

      this.loading = true
      try {
        this.sales = await listMonthlySales(this.selectedMonth)
      } catch (error) {
        this.sales = []
        this.$message.error(getApiErrorMessage(error, '月销售统计加载失败'))
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.table-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
