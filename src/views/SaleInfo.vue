<template>
    <el-form @submit.native.prevent="SaveBook" ref="form" :model="book" label-width="100px">
    <el-form-item label="书号">
      <el-input type="number" v-model="book.isbn"></el-input>
    </el-form-item>
    <el-form-item label="销售数量">
      <el-input type="number" v-model="book.SaleQuantity"></el-input>
    </el-form-item>
    <el-form-item label="销售金额">
      <el-input type="floatValue" v-model="book.SaleAmount"></el-input>
    </el-form-item>
    <el-form-item label="销售日期">
      <el-input type="date" v-model="book.SaleDate"></el-input>
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
          this.$http.post('sale_books',this.book).then(res => {
            console.log("res.data => ", res.data);
            this.$message({
              message: "图书销售信息添加成功",
              type: "success"
            });
          //   this.$router.push('/books/index')
          });
        }
      }
    }
  </script>
  