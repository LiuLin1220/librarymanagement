# API 约定

后端监听 `PORT`，业务接口挂在 `/api` 下。本轮为保持兼容，继续使用原有路径。

## 健康检查

`GET /health` 返回 HTTP 200 和 `{ "status": "ok" }`。它只判断进程是否存活，不
查询 MySQL。

`GET /health/ready` 会执行一次最小数据库查询。数据库可用时返回 HTTP 200 和
`{ "status": "ready" }`；连接失败时返回 HTTP 503 和
`{ "status": "not_ready" }`，不公开驱动错误或凭据。容器健康检查使用这个接口。

## 图书接口

| 方法 | 路径 | 请求 | 成功响应 |
| --- | --- | --- | --- |
| `GET` | `/api/get_books` | 无 | HTTP 200，图书数组（可为 `[]`） |
| `POST` | `/api/add_books` | `isbn`、`title`、`author`、`publisher`、`price` | HTTP 201 |
| `POST` | `/api/update_book_baseinfo` | 完整图书对象 | HTTP 200 或 404 |
| `DELETE` | `/api/dele_book/:id` | 正整数书号 | HTTP 200 或 404 |
| `GET` | `/api/get_books_num` | 无 | HTTP 200，库存数组 |

## 采购、销售和统计接口

| 方法 | 路径 | 请求 | 成功响应 |
| --- | --- | --- | --- |
| `POST` | `/api/buy_books` | `isbn`、`BuyQuantity`、`BuyAmount`、`BuyDate` | HTTP 201 |
| `POST` | `/api/sale_books` | `isbn`、`SaleQuantity`、`SaleAmount`、`SaleDate` | HTTP 201 |
| `GET` | `/api/get_books_sale` | 无 | HTTP 200，销售记录数组 |
| `POST` | `/api/get_books_sale_month` | `YYYY-MM` 格式的 `yearMonth` | HTTP 200，统计数组 |

日期使用 `YYYY-MM-DD`。书号和数量必须在 MySQL 有符号 `INT` 范围内。金额对应
`DECIMAL(10,2)`，最多两位小数，最大值为 `99999999.99`。

## 错误结构

应用错误统一使用有意义的 HTTP 状态码和 JSON：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "书号必须是 1 到 2147483647 之间的整数",
    "details": {
      "field": "isbn"
    }
  }
}
```

未预料的数据库异常返回 `INTERNAL_ERROR`，不包含 SQL、凭据或驱动原始信息；
完整故障只写入服务端日志。
