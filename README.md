# 项目背景

一个数据库课程设计，具有前端页面，安装运行需node和npm，也可当作Web课程设计。存储过程、触发器等在sql语句中。原要求如下。

> **《数据库原理与技术》课程设计：图书销售管理系统**
>
> 系统功能的基本要求：
>
> Ø 图书各种信息的输入。
>
> Ø 图书信息的修改、删除；
>
> Ø 图书销售: 输入书号查询图书信息，输入购买数量、统计销售金额，生成销售记录。
>
> Ø 按照关键字查询、统计符合条件的图书信息：书号、书名、作者、出版社。
>
> Ø 每月图书的销售排名报表生成，包括日期、书名、月销售总量。
>
> **重点：做好销售统计了解图书的销售情况**



# 项目效果

![image](https://github.com/LiuLin1220/librarymanagement/blob/master/images/01.jpg)

![image](https://github.com/LiuLin1220/librarymanagement/blob/master/images/02.jpg)

# 环境

```
npm -v
8.19.4

node -v
v16.20.2
```



# 搭建

根目录下输入

```shell
npm install
```



# 配置

server目录下的config.js文件修改数据库配置信息



# 运行

## 前端

根目录下输入

```shell
npm run serve
```

根据显示信息浏览器进行访问。



## 后端

server目录下输入

```shell
node index.js
```



# 参考资料

* 使用的框架
  * [介绍 | vue-element-admin](https://panjiachen.github.io/vue-element-admin-site/zh/guide/)

* 安装搭建
  * [Vue + Element UI + NodeJs(Express)全栈开发后台管理系统_笔记_vue elementui 管理系统-CSDN博客](https://blog.csdn.net/weixin_42628594/article/details/108594028)

* 后端路由重构
  *  https://www.bilibili.com/video/BV1Up421D7kz 中的“19-使用中间件”

* 前端组件
  * [组件 | Element](https://element.eleme.cn/#/zh-CN/component/installation)

