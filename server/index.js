const express = require('express');
const app = express();
const router = require('./router.js')
const bodyParser = require('body-parser')
const cors = require('cors');

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use("/api", router)


app.listen(3001, () => {
  console.log('http://localhost:3001/');
});