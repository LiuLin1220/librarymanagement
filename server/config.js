// 连接数据库，提供数据库操作方法
const mysql = require('mysql')

const client = mysql.createConnection({
    host: "localhost",
    user: "libraryadmin123",
    password: "admin123",
    database: "librarymanagement"
})

// query:执行数据库语句的方法
function connectMySQL(sql, arr, callback) {
    console.log("connectSQL arr, arr => ", arr);
    
    client.query(sql, arr, function(err, result) {
        console.log("connectMySQL sql => ", sql);
        
        if (err) {
            console.log(err);
            return;
        }
        callback(result);
    })
}

module.exports = connectMySQL