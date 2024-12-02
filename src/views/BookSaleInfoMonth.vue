//ListArticle.vue
<template>
  <div>
    <el-date-picker v-model="selectMonth" type="month" placeholder="选择年月"   
    size="mini" @change="jobSearch" value-format="yyyy-MM"></el-date-picker>
    <el-button type="primary" size="mini" @click="fetch">搜索</el-button>
    <el-table :data="books" stripe size="medium" border fit highlight-current-row  style="width: 100%" :default-sort = "{prop: 'title', order: 'ascending'}">
      <el-table-column prop="title" label="书名" sortable align="center"></el-table-column>
      <el-table-column prop="author" label="作者" sortable align="center"></el-table-column>
      <el-table-column prop="totalSaleQuantity" label="月销售数量" sortable align="center"></el-table-column>
      <el-table-column prop="totalSaleAmount" label="月销售金额" sortable align="center"></el-table-column>

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
        resData: [],
        selectMonth:''
      };
    },
    methods: {
        mockRequset(){
            this.totalItems = this.books.length; // 注意： 这里mock数据是写在data里的，请求需考虑异步的情况
            this.tableData = this.books;
        },
        

      fetch(){
        this.books = []
        console.log("fetch month => ", this.selectMonth);

        // function parseMonthString(monthString){
        //   const [year, month] = monthString.split('-');
        //   return {
        //     year: year,
        //     month: month
        //   };
        // }
        //   const monthDict = parseMonthString(this.selectMonth);
        //   console.log(monthDict);
        
        this.$http.post('get_books_sale_month', {yearMonth: this.selectMonth}).then(res => {
            console.log("res => ", res);
            if (res.status == 200) {
              this.books = res.data
            }
          
          console.log("this.books => ", this.books);
        });
      },
       // 前端搜索功能需要区分是否检索,因为对应的字段的索引不同
    doFilter() {
      console.log("this.month => ", this.selectMonth);
      
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
      },
      jobSearch() {
        this.getJobListByMonth();
      },
    async initData(data) {
      console.log("initData data => ", data);
      
      //获取当前时间
      var now   = new Date();
      var monthn = now.getMonth()+1;
      var yearn  = now.getFullYear();
      this.selectMonth = yearn+"-"+monthn;
 
      this.selectUser = parseInt(sessionStorage.getItem("userid"));
      // this.getWeekJobList({
      //   userid: sessionStorage.getItem("userid"),
      //   weekid: "1"
      // });
      this.getJobListByMonth();
    },
    async getJobListByMonth(data) {
      console.log("getJobListByMonth data => ", data);
      
    }
    },
   
    //进入页面需要获取数据
    created(){
      // this.fetch()
      this.initData({});
    },
    beforeMount(){
        this.mockRequset()
    }
  };
</script>
