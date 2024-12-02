//ListArticle.vue
<template>
  <div>
    <el-input 
      v-model="searchValue" size="mini" clearable
      placeholder="请输入书号、书名、作者或出版社" style="width:300px"></el-input>
    <el-button type="primary" size="mini" @click="doFilter">搜索</el-button>
    
    <el-table :data="tableData" stripe size="medium" border fit highlight-current-row  style="width: 100%" :default-sort = "{prop: 'isbn', order: 'ascending'}">
      <el-table-column prop="isbn" label="书号" sortable align="center"></el-table-column>
      <el-table-column prop="title" label="书名" sortable align="center"></el-table-column>
      <el-table-column prop="author" label="作者" sortable align="center"></el-table-column>
      <el-table-column prop="publisher" label="出版社" sortable align="center"></el-table-column>
      <el-table-column prop="price" label="价格（元）" sortable align="center"></el-table-column>
      <el-table-column label="操作" align="center">
        <template slot-scope="scope">
          <el-button @click="handleEdit(scope.row)" type="primary" size="mini">编辑</el-button>
          <el-button @click="remove(scope.row.isbn)" type="danger" size="mini"
            icon="el-icon-delete" />
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="修改信息" :visible.sync="editDialogVisible" width="30%" :close-on-click-modal="false" center>
        <el-form :model="edit_form">
            <el-form-item label="书号">
                <el-input v-model="edit_form.isbn" disabled></el-input>
            </el-form-item>
            <el-form-item label="书名">
                <el-input v-model="edit_form.title"></el-input>
            </el-form-item>
            <el-form-item label="作者">
                <el-input v-model="edit_form.author"></el-input>
            </el-form-item>
            <el-form-item label="出版社">
                <el-input v-model="edit_form.publisher"></el-input>
            </el-form-item>
            <el-form-item label="价格（元）">
                <el-input v-model="edit_form.price" type="floatValue"></el-input>
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
        books: [],
        searchValue: "",
        edit_form: {
                "title": null,
                "body": null,
            },
        totalItems: 0,
        filterTableData: [],
        tableData: [],
        resData: []
      };
    },
    methods: {
        mockRequset(){
            console.log("mockRequset");
            
            this.totalItems = this.books.length; // 注意： 这里mock数据是写在data里的，请求需考虑异步的情况
            this.tableData = this.books;
        },
      fetch(){
        this.$http.get('get_books').then(res => {
            console.log("res => ", res);
            
          this.books = res.data
          console.log("this.books => ", this.books);
          this.doFilter()
        });
      },
       // 前端搜索功能需要区分是否检索,因为对应的字段的索引不同
    doFilter() {
      this.tableData = [];
      this.filterTableData = [];
      console.log("this.searchValue => ", this.searchValue);
      console.log("books => ", this.books);
      
      this.books.filter((item)=>{
        if('isbn' in item || 'title' in item || 'author' in item || 'publisher' in item){
          // 按编号或地区查询 注意：根据实际数据 灵活调整字母大小写
          if (String(item.isbn).indexOf(this.searchValue) > -1 
            || item.title.indexOf(this.searchValue) > -1
            || item.author.indexOf(this.searchValue) > -1
            || item.publisher.indexOf(this.searchValue) > -1) {
            this.filterTableData.push(item);
          } 
        }
        
      })
      this.totalItems = this.filterTableData.length;
      this.tableData = [];
      let fromNum = 0;
      for (; fromNum < this.totalItems; fromNum++) {
        if (this.filterTableData[fromNum]) {
          this.tableData.push(this.filterTableData[fromNum]);
        }
      }
      
    },
    
      remove(id){
        this.$confirm("确定删除？", "确认信息", {
            distinguishCancelAndClose: true,
            confirmButtonText: "确定",
            cancelButtonText: "放弃",
        }).then(() => {
            this.$http.delete(`dele_book/${id}`).then(res => {
            console.log(res.data);
            this.$message({
                message: "图书删除成功",
                type: "success"
            });
            this.fetch()
            this.mockRequset()
            });
        })
        
      },
      handleEdit(val) {
          console.log("edit val => ", val);
          this.editDialogVisible = true;
          this.edit_form = JSON.parse(JSON.stringify(val));
      },
      updateInfo() {
        console.log("this.edit_form => ", this.edit_form);
        
        this.$http.post('update_book_baseinfo', this.edit_form).then((res) => {
          console.log(res);
          this.editDialogVisible = false;
          this.$message({
            message: "图书信息修改成功",
            type: "success"
          });
          this.fetch()
          })
      }
    },
   
    //进入页面需要获取数据
    created(){
      this.fetch()
    },
    beforeMount(){
        this.mockRequset()
    }
  };
</script>
