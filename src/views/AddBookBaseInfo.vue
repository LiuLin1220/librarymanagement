<template>
  <el-form
    ref="form"
    class="book-form"
    :model="book"
    :rules="rules"
    label-width="100px"
    @submit.native.prevent="saveBook"
  >
    <el-form-item label="书号" prop="isbn">
      <el-input-number
        v-model="book.isbn"
        :controls="false"
        :min="1"
        :max="2147483647"
      />
    </el-form-item>
    <el-form-item label="书名" prop="title">
      <el-input v-model.trim="book.title" maxlength="100" show-word-limit />
    </el-form-item>
    <el-form-item label="作者" prop="author">
      <el-input v-model.trim="book.author" maxlength="100" show-word-limit />
    </el-form-item>
    <el-form-item label="出版社" prop="publisher">
      <el-input v-model.trim="book.publisher" maxlength="100" show-word-limit />
    </el-form-item>
    <el-form-item label="价格（元）" prop="price">
      <el-input-number v-model="book.price" :min="0" :precision="2" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" native-type="submit" :loading="submitting">
        立即添加
      </el-button>
      <el-button :disabled="submitting" @click="reset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { addBook } from '../api/books'
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
  name: 'AddBookBaseInfo',
  data() {
    return {
      book: emptyBook(),
      submitting: false,
      rules: {
        isbn: [{ required: true, message: '请输入书号', trigger: 'change' }],
        title: [{ required: true, message: '请输入书名', trigger: 'blur' }],
        author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
        publisher: [{ required: true, message: '请输入出版社', trigger: 'blur' }],
        price: [{ required: true, message: '请输入价格', trigger: 'change' }]
      }
    }
  },
  methods: {
    async saveBook() {
      const valid = await new Promise(resolve => this.$refs.form.validate(resolve))
      if (!valid) {
        return
      }

      this.submitting = true
      try {
        await addBook(this.book)
        this.$message.success('图书信息添加成功')
        this.reset()
      } catch (error) {
        this.$message.error(getApiErrorMessage(error, '图书信息添加失败'))
      } finally {
        this.submitting = false
      }
    },
    reset() {
      this.book = emptyBook()
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    }
  }
}
</script>

<style scoped>
.book-form {
  max-width: 640px;
}

.book-form .el-input-number {
  width: 100%;
}
</style>
