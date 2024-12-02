//App.vue
<template>
  <el-container style="height: 100vh; border: 1px solid #eee">
  <el-aside width="200px" style="background-color: rgb(238, 241, 246)">
    <!-- <el-menu :default-openeds="openeds" :default-active="active"> -->
    <el-menu router :default-openeds="['1', '2']">
      <el-submenu index='1' @click.native="handleOpen('1')">
          <template slot="title">
<i class="el-icon-edit"></i>添加信息
</template>
        <!-- <el-menu-item index="/articles/create">新建文章</el-menu-item>
        <el-menu-item index="/articles/index">文章列表</el-menu-item> -->
        <el-menu-item index="/Book/add_base_info">添加图书基础信息</el-menu-item>
        <el-menu-item index="/Book/add_buy_info">添加图书采购信息</el-menu-item>
        <el-menu-item index="/Book/add_sale_info">添加图书销售信息</el-menu-item>
      </el-submenu>
      <el-submenu index='2' @click.native="handleOpen('2')">
        <template slot="title">
          <i class="el-icon-document"></i>查看信息
          </template>
        <el-menu-item index="/Book/base_info">图书基础信息</el-menu-item>
        <el-menu-item index="/Book/storage_info">图书数量信息</el-menu-item>        
        <el-menu-item index="/Book/sale_info">图书销售情况</el-menu-item>
        <el-menu-item index="/Book/sale_info_month">每月图书销售情况</el-menu-item>
      </el-submenu>
    </el-menu>
  </el-aside>
  

  <el-container>
    <el-header style="text-align: right; font-size: 12px">
      <el-dropdown>
        <i class="el-icon-setting" style="margin-right: 15px"></i>
        <el-dropdown-menu slot="dropdown">
          <!-- <el-dropdown-item>查看</el-dropdown-item>
          <el-dropdown-item>新增</el-dropdown-item>
          <el-dropdown-item>删除</el-dropdown-item>
          <el-dropdown-item>图书</el-dropdown-item> -->
          </el-dropdown-menu>
      </el-dropdown>
      <span>图书销售管理系统</span>
    </el-header>
    
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</el-container>
</template>

<style>
html,body{
  padding: 0;
  margin: 0;
}
  .el-header {
    background-color: #B3C0D1;
    color: #333;
    line-height: 60px;
  }
  
  .el-aside {
    color: #333;
  }
</style>

<script>
  export default {
    data() {
      return {
        openeds: ['2'],
      }
    },
    methods: {
    handleOpen(index) {
      this.openeds = [index]; // 点击时只展开对应的下拉框
      console.log("this.openeds => ", this.openeds);
      
    },
  },
  };
</script>
