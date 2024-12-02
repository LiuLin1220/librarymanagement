<template>
  <el-form @submit.native.prevent="SaveBook" ref="form" :model="book" label-width="100px">
  <el-form-item label="书号">
    <el-input type="number" v-model="book.isbn"></el-input>
  </el-form-item>
  <el-form-item label="书名">
    <el-input type="textarea" v-model="book.title"></el-input>
  </el-form-item>
  <el-form-item label="作者">
    <el-input type="textarea" v-model="book.author"></el-input>
  </el-form-item>
  <el-form-item label="出版社">
    <el-input type="textarea" v-model="book.publisher"></el-input>
  </el-form-item>
  <el-form-item label="价格">
    <el-input type="floatValue" v-model="book.price"></el-input>
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
        this.$http.post('add_books',this.book).then(res => {
          console.log("res.data => ", res.data);
          console.log("res.status => ", res.status);
          
          if (res.status == 200) {
            this.$message({
              message: "图书信息添加成功",
              type: "success"
            });  
          } else {
            this.$message({
              message: "图书信息添加失败，请检查书号是否重复",
              type: "error"
            });
          }
          
        });
      }
    }
  }
</script>
