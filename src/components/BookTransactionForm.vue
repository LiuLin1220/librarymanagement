<template>
  <el-form
    ref="form"
    class="transaction-form"
    :model="form"
    :rules="rules"
    label-width="100px"
    @submit.native.prevent="submit"
  >
    <el-form-item label="书号" prop="isbn">
      <el-input-number
        v-model="form.isbn"
        :controls="false"
        :min="1"
        :max="2147483647"
      />
    </el-form-item>
    <el-form-item :label="`${actionLabel}数量`" prop="quantity">
      <el-input-number v-model="form.quantity" :min="1" :precision="0" />
    </el-form-item>
    <el-form-item :label="`${actionLabel}金额`" prop="amount">
      <el-input-number v-model="form.amount" :min="0" :precision="2" />
    </el-form-item>
    <el-form-item :label="`${actionLabel}日期`" prop="date">
      <el-date-picker
        v-model="form.date"
        type="date"
        value-format="yyyy-MM-dd"
        placeholder="选择日期"
      />
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
import { addPurchase, addSale } from '../api/books'
import { getApiErrorMessage } from '../api/http'

function emptyForm() {
  return {
    isbn: undefined,
    quantity: 1,
    amount: 0,
    date: ''
  }
}

export default {
  name: 'BookTransactionForm',
  props: {
    kind: {
      type: String,
      required: true,
      validator: value => ['purchase', 'sale'].includes(value)
    }
  },
  data() {
    return {
      form: emptyForm(),
      submitting: false,
      rules: {
        isbn: [{ required: true, message: '请输入书号', trigger: 'change' }],
        quantity: [{ required: true, message: '请输入数量', trigger: 'change' }],
        amount: [{ required: true, message: '请输入金额', trigger: 'change' }],
        date: [{ required: true, message: '请选择日期', trigger: 'change' }]
      }
    }
  },
  computed: {
    actionLabel() {
      return this.kind === 'purchase' ? '采购' : '销售'
    }
  },
  methods: {
    async submit() {
      const valid = await new Promise(resolve => this.$refs.form.validate(resolve))
      if (!valid) {
        return
      }

      this.submitting = true
      try {
        const submitTransaction = this.kind === 'purchase' ? addPurchase : addSale
        await submitTransaction(this.form)
        this.$message.success(`图书${this.actionLabel}信息添加成功`)
        this.reset()
      } catch (error) {
        this.$message.error(
          getApiErrorMessage(error, `图书${this.actionLabel}信息添加失败`)
        )
      } finally {
        this.submitting = false
      }
    },
    reset() {
      this.form = emptyForm()
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    }
  }
}
</script>

<style scoped>
.transaction-form {
  max-width: 560px;
}

.transaction-form .el-input-number,
.transaction-form .el-date-editor {
  width: 100%;
}
</style>
