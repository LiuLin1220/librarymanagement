//ListArticle.vue
<template>
  <div>
    
    <!-- <el-input 
      v-model="searchValue" size="mini" clearable
      placeholder="请输入书号、书名、作者或出版社" style="width:300px"></el-input>
    <el-button type="primary" size="mini" @click="doFilter">搜索</el-button> -->
    
    <el-table :data="tableData" stripe size="medium" border fit highlight-current-row  style="width: 100%" :default-sort = "{prop: 'title', order: 'ascending'}">
      <el-table-column prop="title" label="书名" sortable align="center"></el-table-column>
      <el-table-column prop="author" label="作者" sortable align="center"></el-table-column>
      <el-table-column prop="SaleQuantity" label="销售数量" sortable align="center"></el-table-column>
      <el-table-column prop="SaleAmount" label="销售金额" sortable align="center"></el-table-column>
      <el-table-column prop="SaleDate" label="销售日期" sortable align="center" :format="Date"></el-table-column>
      <!-- <el-table-column fixed="right" label="操作" width="100"> -->
        <!-- <template slot-scope="scope">
          <el-button @click="handleEdit(scope.row)" type="text" size="small">编辑</el-button>
          <el-button @click="remove(scope.row.isbn)" type="text" size="small">删除</el-button>
        </template> -->
      <!-- </el-table-column> -->
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
            this.totalItems = this.books.length; // 注意： 这里mock数据是写在data里的，请求需考虑异步的情况
            this.tableData = this.books;
        },
      fetch(){
        this.$http.get('get_books_sale').then(res => {
            console.log("res => ", res);
            
          this.books = res.data
          console.log("fetch this.books => ", this.books);
          console.log("date", this.books[0].SaleDate);
                // 假设 this.books 是一个包含多个对象的数组，每个对象都有一个 SaleDate 属性
        this.books.forEach(book => {
        // 创建一个新的 Date 对象
        let date = new Date(book.SaleDate);

        // 使用 toISOString 方法转换为 YYYY-MM-DDTHH:mm:ss.sssZ 格式，并提取 YYYY-MM-DD 部分
        let formattedDate = date.toISOString().slice(0, 10);

        // 将格式化后的日期放回 book 对象的 SaleDate 属性中
        book.SaleDate = formattedDate;

        // 如果你需要输出每个处理后的日期，可以在这里打印
        console.log("Formatted Date:", formattedDate);
        });
          
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
        this.$http.delete(`dele_book/${id}`).then(res => {
          console.log(res.data);
          this.$message({
            message: "图书删除成功",
            type: "success"
          });
          this.fetch()
          this.mockRequset()
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
    },
    beforeMount(){
        this.mockRequset()
    }
  };
</script>
