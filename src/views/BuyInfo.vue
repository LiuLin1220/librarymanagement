<template>
    <el-form @submit.native.prevent="SaveBook" ref="form" :model="book" label-width="100px">
    <el-form-item label="书号">
      <el-input type="number" v-model="book.isbn"></el-input>
    </el-form-item>
    <el-form-item label="采购数量">
      <el-input type="number" v-model="book.BuyQuantity"></el-input>
    </el-form-item>
    <el-form-item label="采购金额">
      <el-input type="floatValue" v-model="book.BuyAmount"></el-input>
    </el-form-item>
    <el-form-item label="采购日期">
      <el-input type="date" v-model="book.BuyDate"></el-input>
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" native-type="submit">立即添加</el-button>
      <el-button>取消</el-button>
    </el-form-item>
  </el-form>
  </template>
  <script>
    export default {
      data() {
        return {
          book: {}
        }
      },
      methods: {
        SaveBook() {
          this.$http.post('buy_books',this.book).then(res => {
            console.log("res.data => ", res.data);
            this.$message({
              message: "图书采购信息添加成功",
              type: "success"
            });
          //   this.$router.push('/books/index')
          });
        }
      }
    }
  </script>
  