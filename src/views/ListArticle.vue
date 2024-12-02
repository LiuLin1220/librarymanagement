//ListArticle.vue
<template>
  <div>
    <el-table :data="articles">
      <el-table-column prop="title" label="标题" width="140"></el-table-column>
      <el-table-column prop="body" label="内容" width="600"></el-table-column>
      <el-table-column fixed="right" label="操作" width="100">
        <template slot-scope="scope">
          <el-button @click="handleEdit(scope.row)" type="text" size="small">编辑</el-button>
          <el-button @click="remove(scope.row._id)" type="text" size="small">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="修改信息" :visible.sync="editDialogVisible" width="30%" :close-on-click-modal="false" center>
        <el-form :model="edit_form">
            <el-form-item label="标题">
                <el-input v-model="edit_form.title"></el-input>
            </el-form-item>
            <el-form-item label="内容">
                <el-input v-model="edit_form.body"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
            <el-button @click="editDialogVisible = false">取 消</el-button>
            <el-button type="primary" @click="updateInfo()">确 定</el-button>
        </span>
    </el-dialog>
  </div>
</template>
<script>
  export default {
    data() {
      return {
        editDialogVisible: false,
        articles: [],
        edit_form: {
                "title": null,
                "body": null,
            }
      };
    },
    methods: {
      fetch(){
        this.$http.get('articles').then(res => {
            console.log("res => ", res);
            
          this.articles = res.data
          console.log("this.articles => ", this.articles);
          
        });
      },
      // edit(){
      // },
      remove(id){
        console.log("id => ", id);
        
        this.$http.delete(`articles/${id}`).then(res => {
          console.log(res.data);
          this.$message({
            message: "文章删除成功",
            type: "success"
          });
          this.fetch()
        });
      },
      handleEdit(val) {
          console.log("edit val => ", val);
          
          this.editDialogVisible = true;
          this.edit_form = JSON.parse(JSON.stringify(val));
      },
      updateInfo() {
        console.log("this.edit_form => ", this.edit_form);
        
        this.$http.post('update', this.edit_form).then((res) => {
          console.log(res);
          this.editDialogVisible = false;
          this.$message({
            message: "文章修改成功",
            type: "success"
          });
          this.fetch()
          })
      }
    },
   
    //进入页面需要获取数据
    created(){
      this.fetch()
    }
  };
</script>
