const express = require('express')
const router = express.Router()
const url = require('url')
const connectMySQL = require('./config');
const { modelNames } = require('mongoose');

router.post('/add_books', async (req, res) => {
    console.log("add_books req => ", req.body);
    
  try {
    const { isbn, title, author, publisher, price } = req.body;
    
    const sql = "INSERT INTO bookbaseinfo (isbn, title, author, publisher, price) VALUES (?, ?, ?, ?, ?)"

    connectMySQL(sql, [isbn, title, author, publisher, price], function(result){
        console.log(sql);
        console.log("result.affectRow => ", result.affectedRows);
        
        if (result.affectedRows > 0) {
            res.send({
                status: 200
            }) 
        } else {
            res.send({
                status: 500
            })
        }
    })
  } catch (err) {
    res.status(500).send('Error creating article');
  }
});

router.post('/update_book_baseinfo', async (req, res) => {
    console.log("update_book_baseinfo /articles");
    
    console.log("req => ", req.body);
    
  try {
    const { title, author, publisher, price, isbn } = req.body;

    
    // const sql = "INSERT INTO articles (title, body) VALUES (?, ?)"
    const sql = "update bookbaseinfo set Title=?, Author=?, Publisher=?, Price=? where isbn=?"

    connectMySQL(sql, [title, author, publisher, price, isbn], function(result){
        console.log(result);
        console.log("result.affectRow => ", result.affectedRows);
        
        if (result.affectedRows > 0) {
            res.send({
                status: 200
            }) 
        } else {
            res.send({
                msg: "修改错误"
            })
        }
    })
  } catch (err) {
    res.status(500).send('Error creating article');
  }
});

router.get('/get_books', async (req, res) => {
    try {
      const sql = "select * from 图书基本信息"
  
      connectMySQL(sql, null, function(result){
        console.log("get_books  => ", result);
        
        const transformedData = result.map(item => ({
                isbn: item.书号,
                title: item.书名,
                author: item.作者,
                publisher: item.出版社,
                price: item['价格（元）']
            }));  
            console.log("transformedData => ", transformedData);
            
          if (result.length > 0) {
              res.send(transformedData)
          } else {
              res.send({
                  msg: "获取数据失败"
              })
          }
      })
    } catch (err) {
      console.log("err => ", err);
      
      res.status(500).send('Error fetching articles');
    }
  });

router.delete('/dele_book/:id', async (req, res) => {
  try {
    console.log("dele req => ", req.params.id);
    isbn = req.params.id
    console.log("dele isbn => ", isbn);
    
    const sql = "DELETE FROM bookbaseinfo WHERE isbn = ?"

    connectMySQL(sql, [isbn], function(result){
        console.log("dele_book sql => ", sql);
        console.log("result => ", result);
        
        
        if (result.affectedRows > 0) {
            res.send({
                status: 200,
                msg: "删除成功"
            })
        } else {
            res.send({
                msg: "删除失败"
            })
        }
    })
  } catch (err) {
    console.log("err => ", err);
    
    res.status(500).send('Error fetching articles');
  }
});

router.get('/get_books_num', async (req, res) => {
    try {
      const sql = "select * from 图书数量"
  
      connectMySQL(sql, null, function(result){
        console.log("get_books_num  => ", result);
        
        const transformedData = result.map(item => ({
                isbn: item.书号,
                title: item.书名,
                author: item.作者,
                num: item.数量,
            }));  
            console.log("transformedData => ", transformedData);
            
          if (result.length > 0) {
              res.send(transformedData)
          } else {
              res.send({
                  msg: "获取数据失败"
              })
          }
      })
    } catch (err) {
      console.log("err => ", err);
      
      res.status(500).send('Error fetching articles');
    }
});

router.post('/buy_books', async (req, res) => {
    console.log("add_books req => ", req.body);
    
  try {
    const { isbn, BuyQuantity, BuyAmount, BuyDate } = req.body;
    
    const sql = "INSERT INTO buyinfo (isbn, BuyQuantity, BuyAmount, BuyDate) VALUES (?, ?, ?, ?)"

    connectMySQL(sql, [isbn, BuyQuantity, BuyAmount, BuyDate], function(result){
        console.log(sql);
        console.log("result.affectRow => ", result.affectedRows);
        
        if (result.affectedRows > 0) {
            res.send({
                status: 200
            }) 
        } else {
            res.send({
                msg: "添加失败"
            })
        }
    })
  } catch (err) {
    res.status(500).send('Error creating article');
  }
});

router.post('/sale_books', async (req, res) => {
    console.log("add_books req => ", req.body);
    
  try {
    const { isbn, SaleQuantity, SaleAmount, SaleDate } = req.body;
    
    const sql = "INSERT INTO saleinfo (isbn, SaleQuantity, SaleAmount, SaleDate) VALUES (?, ?, ?, ?)"

    connectMySQL(sql, [isbn, SaleQuantity, SaleAmount, SaleDate], function(result){
        console.log(sql);
        console.log("result.affectRow => ", result.affectedRows);
        
        if (result.affectedRows > 0) {
            res.send({
                status: 200
            }) 
        } else {
            res.send({
                msg: "添加失败"
            })
        }
    })
  } catch (err) {
    res.status(500).send('Error creating article');
  }
});

router.get('/get_books_sale', async (req, res) => {
    try {
        const sql = "select * from 图书销售"

        connectMySQL(sql, null, function(result){
        console.log("get_books  => ", result);
        
        const transformedData = result.map(item => ({
                title: item.书名,
                author: item.作者,
                SaleQuantity: item.销售数量,
                SaleAmount: item.销售金额,
                SaleDate: item.销售日期
            }));  
            console.log("transformedData => ", transformedData);
            
            if (result.length > 0) {
                res.send(transformedData)
            } else {
                res.send({
                    msg: "获取数据失败"
                })
            }
        })
    } catch (err) {
        console.log("err => ", err);
        
        res.status(500).send('Error fetching articles');
    }
});

router.post('/get_books_sale_month', async (req, res) => {
    console.log("/get_books_sale_month req.body => ", req.body);
    console.log("typeof req.body => ", typeof req.body);
    
    let {yearMonth} = req.body
    // console.log("year", typeof year);
    
    // year = parseInt(year, 10)
    // month = parseInt(month, 10)
    
    // console.log("year", typeof year);
    try {
        // let sql = "SELECT 书名, 作者, SUM(销售数量) AS 总销售数量, SUM(销售金额) AS 总销售金额 FROM 图书销售 WHERE 销售日期 LIKE ? GROUP BY 书名, 作者;";

        let sql = "CALL get_book_sale_month(?);"

        console.log("before sql => ", sql);
        
        // 准备 SQL 查询的参数
        // const yearMonth = `${year}-${String(month).padStart(2, '0')}`; // 确保月份是两位数

        console.log("sql => ", sql);
        console.log("yearMonth => ", yearMonth);
        
        
        
        connectMySQL(sql, [yearMonth], function(result){
        console.log("get_books_sale_month result  => ", result);
        const transformedData = result[0].map(item => ({
                title: item.书名,
                author: item.作者,
                totalSaleQuantity: item.总销售数量,
                totalSaleAmount: item.总销售金额
            }));  
            console.log("transformedData => ", transformedData);
            
            if (result.length > 0) {
                res.status(200).send(transformedData)
            } else {
                res.status(500).send('Error fetching articles');
            }
        })
    } catch (err) {
        console.log("err => ", err);
        
        res.status(500).send('Error fetching articles');
    }
});



module.exports = router