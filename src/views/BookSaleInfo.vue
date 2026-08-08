<template>
  <div>
    <div class="table-toolbar">
      <el-button size="small" icon="el-icon-refresh" @click="loadSales">
        刷新
      </el-button>
    </div>
    <el-table
      v-loading="loading"
      :data="sales"
      stripe
      border
      fit
      empty-text="暂无销售记录"
      :default-sort="{ prop: 'SaleDate', order: 'descending' }"
    >
      <el-table-column prop="title" label="书名" sortable align="center" />
      <el-table-column prop="author" label="作者" sortable align="center" />
      <el-table-column prop="SaleQuantity" label="销售数量" sortable align="center" />
      <el-table-column prop="SaleAmount" label="销售金额" sortable align="center" />
      <el-table-column prop="SaleDate" label="销售日期" sortable align="center" />
    </el-table>
  </div>
</template>

<script>
import { listSales } from '../api/books'
import { getApiErrorMessage } from '../api/http'
import { formatDate } from '../utils/date'

export default {
  name: 'BookSaleInfo',
  data() {
    return {
      sales: [],
      loading: false
    }
  },
  created() {
    this.loadSales()
  },
  methods: {
    async loadSales() {
      this.loading = true
      try {
        const sales = await listSales()
        this.sales = sales.map(sale => ({
          ...sale,
          SaleDate: formatDate(sale.SaleDate)
        }))
      } catch (error) {
        this.sales = []
        this.$message.error(getApiErrorMessage(error, '销售记录加载失败'))
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.table-toolbar {
  margin-bottom: 16px;
}
</style>
