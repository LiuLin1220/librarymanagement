<template>
  <el-container class="app-shell">
    <el-aside class="app-sidebar" width="220px">
      <div class="app-brand">图书销售管理</div>
      <el-menu
        router
        :default-active="$route.path"
        :default-openeds="['write', 'read']"
      >
        <el-submenu index="write">
          <template slot="title">
            <i class="el-icon-edit" />
            <span>添加信息</span>
          </template>
          <el-menu-item index="/Book/add_base_info">添加图书基础信息</el-menu-item>
          <el-menu-item index="/Book/add_buy_info">添加图书采购信息</el-menu-item>
          <el-menu-item index="/Book/add_sale_info">添加图书销售信息</el-menu-item>
        </el-submenu>
        <el-submenu index="read">
          <template slot="title">
            <i class="el-icon-document" />
            <span>查看信息</span>
          </template>
          <el-menu-item index="/Book/base_info">图书基础信息</el-menu-item>
          <el-menu-item index="/Book/storage_info">图书数量信息</el-menu-item>
          <el-menu-item index="/Book/sale_info">图书销售情况</el-menu-item>
          <el-menu-item index="/Book/sale_info_month">每月图书销售情况</el-menu-item>
        </el-submenu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="app-header">图书销售管理系统</el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style>
html,
body,
#app {
  min-width: 960px;
  height: 100%;
  padding: 0;
  margin: 0;
  color: #303133;
  background: #f5f7fa;
}

.app-shell {
  min-height: 100%;
}

.app-sidebar {
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid #ebeef5;
}

.app-brand {
  height: 60px;
  font-size: 18px;
  font-weight: 600;
  line-height: 60px;
  color: #1f2d3d;
  text-align: center;
  border-bottom: 1px solid #ebeef5;
}

.app-sidebar .el-menu {
  border-right: 0;
}

.app-header {
  font-size: 16px;
  font-weight: 600;
  line-height: 60px;
  color: #303133;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.app-main {
  margin: 20px;
  background: #fff;
  border-radius: 4px;
}
</style>
