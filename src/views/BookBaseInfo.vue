<template>
  <div>
    <div class="table-toolbar">
      <el-input
        v-model="searchValue"
        size="small"
        clearable
        prefix-icon="el-icon-search"
        placeholder="请输入书号、书名、作者或出版社"
      />
      <el-button size="small" icon="el-icon-refresh" @click="loadBooks">
        刷新
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredBooks"
      stripe
      border
      fit
      highlight-current-row
      empty-text="暂无图书数据"
      :default-sort="{ prop: 'isbn', order: 'ascending' }"
    >
      <el-table-column prop="isbn" label="书号" sortable align="center" />
      <el-table-column prop="title" label="书名" sortable align="center" />
      <el-table-column prop="author" label="作者" sortable align="center" />
      <el-table-column prop="publisher" label="出版社" sortable align="center" />
      <el-table-column prop="price" label="价格（元）" sortable align="center" />
      <el-table-column label="操作" width="170" align="center">
        <template slot-scope="scope">
          <el-button size="mini" type="primary" @click="openEdit(scope.row)">
            编辑
          </el-button>
          <el-button
            size="mini"
            type="danger"
            icon="el-icon-delete"
            @click="removeBook(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      title="修改图书信息"
      :visible.sync="editDialogVisible"
      width="480px"
      :close-on-click-modal="false"
      @closed="clearEditForm"
    >
      <el-form ref="editForm" :model="editForm" :rules="rules" label-width="100px">
        <el-form-item label="书号" prop="isbn">
          <el-input v-model="editForm.isbn" disabled />
        </el-form-item>
        <el-form-item label="书名" prop="title">
          <el-input v-model.trim="editForm.title" maxlength="100" />
        </el-form-item>
        <el-form-item label="作者" prop="author">
          <el-input v-model.trim="editForm.author" maxlength="100" />
        </el-form-item>
        <el-form-item label="出版社" prop="publisher">
          <el-input v-model.trim="editForm.publisher" maxlength="100" />
        </el-form-item>
        <el-form-item label="价格（元）" prop="price">
          <el-input-number v-model="editForm.price" :min="0" :precision="2" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button :disabled="saving" @click="editDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">
          保存
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  deleteBook as deleteBookRequest,
  listBooks,
  updateBook
} from '../api/books'
import { getApiErrorMessage } from '../api/http'

function emptyBook() {
  return {
    isbn: undefined,
    title: '',
    author: '',
    publisher: '',
    price: 0
  }
}

export default {
  name: 'BookBaseInfo',
  data() {
    return {
      books: [],
      searchValue: '',
      loading: false,
      saving: false,
      editDialogVisible: false,
      editForm: emptyBook(),
      rules: {
        title: [{ required: true, message: '请输入书名', trigger: 'blur' }],
        author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
        publisher: [{ required: true, message: '请输入出版社', trigger: 'blur' }],
        price: [{ required: true, message: '请输入价格', trigger: 'change' }]
      }
    }
  },
  computed: {
    filteredBooks() {
      const keyword = this.searchValue.trim().toLocaleLowerCase()
      if (!keyword) {
        return this.books
      }

      return this.books.filter(book =>
        [book.isbn, book.title, book.author, book.publisher].some(value =>
          String(value === null || value === undefined ? '' : value)
            .toLocaleLowerCase()
            .includes(keyword)
        )
      )
    }
  },
  created() {
    this.loadBooks()
  },
  methods: {
    async loadBooks() {
      this.loading = true
      try {
        this.books = await listBooks()
      } catch (error) {
        this.books = []
        this.$message.error(getApiErrorMessage(error, '图书信息加载失败'))
      } finally {
        this.loading = false
      }
    },
    openEdit(book) {
      this.editForm = { ...book }
      this.editDialogVisible = true
    },
    clearEditForm() {
      this.editForm = emptyBook()
      this.$nextTick(() => this.$refs.editForm && this.$refs.editForm.clearValidate())
    },
    async saveEdit() {
      const valid = await new Promise(resolve => this.$refs.editForm.validate(resolve))
      if (!valid) {
        return
      }

      this.saving = true
      try {
        await updateBook(this.editForm)
        this.editDialogVisible = false
        this.$message.success('图书信息修改成功')
        await this.loadBooks()
      } catch (error) {
        this.$message.error(getApiErrorMessage(error, '图书信息修改失败'))
      } finally {
        this.saving = false
      }
    },
    async removeBook(book) {
      try {
        await this.$confirm(`确定删除《${book.title}》？`, '确认信息', {
          confirmButtonText: '确定',
          cancelButtonText: '放弃',
          type: 'warning'
        })
        await deleteBookRequest(book.isbn)
        this.$message.success('图书删除成功')
        await this.loadBooks()
      } catch (error) {
        if (error === 'cancel' || error === 'close') {
          return
        }
        this.$message.error(getApiErrorMessage(error, '图书删除失败'))
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

.table-toolbar .el-input {
  width: 360px;
}

.el-dialog .el-input-number {
  width: 100%;
}
</style>
