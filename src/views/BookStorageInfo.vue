<template>
  <div>
    <div class="table-toolbar">
      <el-button size="small" icon="el-icon-refresh" @click="loadInventory">
        刷新
      </el-button>
    </div>
    <el-table
      v-loading="loading"
      :data="books"
      stripe
      border
      fit
      empty-text="暂无库存数据"
      :default-sort="{ prop: 'isbn', order: 'ascending' }"
    >
      <el-table-column prop="isbn" label="书号" sortable align="center" />
      <el-table-column prop="title" label="书名" sortable align="center" />
      <el-table-column prop="author" label="作者" sortable align="center" />
      <el-table-column prop="num" label="数量" sortable align="center" />
    </el-table>
  </div>
</template>

<script>
import { listInventory } from '../api/books'
import { getApiErrorMessage } from '../api/http'

export default {
  name: 'BookStorageInfo',
  data() {
    return {
      books: [],
      loading: false
    }
  },
  created() {
    this.loadInventory()
  },
  methods: {
    async loadInventory() {
      this.loading = true
      try {
        this.books = await listInventory()
      } catch (error) {
        this.books = []
        this.$message.error(getApiErrorMessage(error, '库存信息加载失败'))
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
