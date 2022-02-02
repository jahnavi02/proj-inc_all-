const Razorpay = require('razorpay');
const express = require('express');
var crypto = require('crypto');

const app = express();

app.use(express.json());

var User = require('./models/userModel');
var bodyParser = require('body-parser');
var jsonwebtoken = require('jsonwebtoken');

const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI;
mongoose.connect('mongodb://127.0.0.1:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("Successfully connect to MongoDB.");
    // initial();
})
.catch(err => {
    console.error("Connection error", err);
    process.exit();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
  
app.use(function(req, res, next) {
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
      jsonwebtoken.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode) {
        if (err) req.user = undefined;
        req.user = decode;
        next();
      });
    } else {
      req.user = undefined;
      next();
    }
});
var routes = require('./routes/userRoute');
routes(app);

var instance = new Razorpay ({
    key_id: 'rzp_test_wUoU7M4Za84fAW',
    key_secret: 'xuAjZ07PhxhuJHAgg8I4y1lM', 
})


app.post('/createOrder', (req,res) => {
    const amount = req.body.amount;
    const currency = req.body.currency;
    const receipt = req.body.receipt;
    instance.orders.create({amount,currency,receipt}, (err, order)=> {
        if(!err){
            res.json(order);
        }else{
            res.send(err);
        }
    });
});

app.post('/verifyOrder',  (req, res)=>{ 
      
    const {order_id, payment_id} = req.body;     
    const razorpay_signature =  req.headers['x-razorpay-signature'];
  
    const key_secret = 'xuAjZ07PhxhuJHAgg8I4y1lM';     
  
    let hmac = crypto.createHmac('sha256', key_secret); 
  
    
    hmac.update(order_id + "|" + payment_id);
      
    const generated_signature = hmac.digest('hex');
      
      
    if(razorpay_signature===generated_signature){
        res.json({success:true, message:"Payment has been verified"})
    }
    else
    res.json({success:false, message:"Payment verification failed"})
});

app.use(function(req, res) {
    res.status(404).send({ url: req.originalUrl + ' not found' })
});

const PORT = process.env.PORT || '3000';

app.listen(PORT, () => {
    console.log('Server is listening on port ', PORT);
});


module.exports = app;

