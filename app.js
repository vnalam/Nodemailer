var express = require('express');
var mongoose = require('mongoose');
var Vinay = require('./employee');
var nodemailer = require('nodemailer');//nodemailer module
//var smtpTransport = require('nodemailer-smtp-transport');
var config = require('config.json')('./config/mv.json');
var bodyParser = require('body-parser');
var fs = require("fs");
var port = process.env.port || 1007;
var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
//cors headers
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//mongoose 
mongoose.connect('mongodb://'+config.mongodb.host+':'+config.mongodb.port+'/VinayDB',function(err)
{ 
	if(err)
	{  
		console.log("DB Error"+err); 
	}
	else 
	{     
		console.log("MongoDB connected");
	}
//insert API	
	app.get('/insertData',function(req,res)
	{
		res.sendFile( __dirname + "/create.html" );
	});

	app.post('/api/insert', function(req, res) 
	{
		var employee ={
			_id: req.body.eEmail,
			eName: req.body.eName,
			eEmail: req.body.eEmail
        }
		
		insertEmployee(employee, function(createData)
		{
			res.json(createData);
		});
	
	});

	var insertEmployee = function(createData, callback)
	{
		Vinay.create(createData, function(err, employee) 
		{  
		
			if (employee) 
			{
				response = 
				{
					"result": "Data inserted succesfully"
				}
				fs.writeFile('input.txt',JSON.stringify(createData),"utf8", function(err) {
		if (err) {
		return console.error(err);
			}
		console.log("Data written successfully!");
		});
		fs.readFile("input.txt", function (err, data) {
	var transporter = nodemailer.createTransport({       
 service: 'Gmail',       
 auth: {            
 user: 'apcloud1234@gmail.com',           
 pass: 'apcloud@1234'         
 }    
 });				
 
 var mailOptions = {    
 from: 'apcloud1234@gmail.com',  
 to:createData.eEmail,
 subject: 'NodeMailer',   
  body: 'mail content...',
  text: 'Task Acomplished by vinay',
 attachments: [{'filename': 'input.txt', 'content': data}]
 };
 transporter.sendMail(
 mailOptions, function(error, info)
 {    if(error)
 {        
 console.log(error);        
    
 }else{        
 console.log('Message sent: ' + info.response);       
     
 };
 });
	
});
				callback(response);
			} else 
			{
				error = {
					"error": "Sorry insertion failed"
				}
				callback(error);
			}
		});
	}

	app.post('/api/retrieve', function(req, res) 
	{
		var employee ={
			_id: req.body.eEmail,
			eEmail: req.body.eEmail
		}
		getEmployee(employee, function(showData)
		{
			res.json(showData);
		});
	
	});

	var getEmployee = function(showData, callback)
	{
		Vinay.find(showData, function(err, employee) 
		{
			if (employee) 
			{
				response = {
					"output": employee
				}
				callback(response);
			} else 
			{
				error = {
                "error": "No data found"
				}
				callback(error);
			}
		});
	}

	app.post('/api/update', function(req, res) 
	{
		var employee = {
			_id: req.body.eEmail,
			eName: req.body.eName,
			eEmail: req.body.eEmail 
			}
			updateEmployee(employee, function(updateData)
			{
				res.json(updateData);
			})
	})
   
	var updateEmployee = function(updateData, callback)
	{
		var id = updateData.eEmail;
		var id1 = updateData.eName;
		console.log(id1)
		Vinay.findOneAndUpdate({"eEmail":id}, {$set:{"eName":id1}}, function(err, employee) 
		{
			if (employee) 
			{
				response = {
                "result": employee
				}
				callback(response);
				console.log(response)
			} else
			{
			error = {
                "error": "Sorry update failed"
				}
				callback(error);
			}
		});
	};

})
app.listen(port);
console.log('Server is running on port ' + port);
