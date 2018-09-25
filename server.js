/*********************************************************************************
* Personal Project
* Name: Shutian Xu   
* Online (Heroku) Link: https://evening-forest-29425.herokuapp.com/
********************************************************************************/
var express = require("express");
var data_service = require("./data-service.js");
var path = require("path");
var app = express();
var multer = require("multer");
var fs = require('fs');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');


var HTTP_PORT = process.env.PORT || 8080;

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on port: " + HTTP_PORT);
}

app.engine(".hbs", exphbs({
  extname: ".hbs",
  defaultLayout: 'main',
  helpers: {
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },
    navLink: function(url, options){
      return '<li' + 
          ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
          '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    }
  
  }
}));

app.use(function(req,res,next){
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
  next();
});
app.set("view engine", ".hbs");

// load CSS file
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

/////////// setup middleware multer for uploading files ///////////
const storage = multer.diskStorage({
  destination: "./public/pimages/uploaded",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", function(req,res){
   //res.sendFile(path.join(__dirname + "/views/home.hbs" ));
   res.render("home");
});

app.post("/images/add", upload.single("imageFile"), function(req, res){
  res.redirect("/images");
})
// add a route to listen on o	GET /images
app.get("/images", function(req,res){
      fs.readdir(__dirname + "/public/pimages/uploaded", function(err, images){
       // res.json({images});
       res.render("images", {data: images}); 
      });
});



// add a new 'route' to listen on /employees/add 
//app.get("/employees/add", function(req,res){
  //res.sendFile(path.join(__dirname + "/views/addEmployee.html" ));
 // res.render("addEmployee");
//});

// add a Post 'route' to listen on POST /employees/add
app.post("/employees/add", (req, res) => {
  data_service.addEmployee(req.body).then(function(data) {
    res.redirect("/employees");
  }).catch(function(err){
    console.log(err);
  })
});

// add a new 'route' to listen on /images/add
app.get("/images/add", function(req,res){
  //res.sendFile(path.join(__dirname + "/views/addImage.html" ));
  res.render("addImage");
});

// setup another route to listen on /about
app.get("/about", function(req,res){
  //res.sendFile(path.join(__dirname + "/views/about.html" ));
  res.render("about");
});

// setup another route to listen on /employees
app.get("/employees", function(req,res){
  if (req.query.status) {
    //res.send("status here");
    return data_service.getEmployeesByStatus(req.query.status).then(function(data){
      if (data.length > 0) {
        res.render("employees", {employees: data});
      } else {
        res.render("employees", {message: "no results"});
      }
    }).catch(function(err){
      res.render("employees", {message: "no results"});
    })
  } else if (req.query.department) {
    //res.send("department here")
    data_service.getEmployeesByDepartment(req.query.department).then(function(data){
      if (data.length > 0) {
        res.render("employees", {employees: data});
      } else {
        res.render("employees", {message: "no results"});
      }
    }).catch(function(err){
      res.render("employees", {message: "no results"});
    })
  } else if (req.query.manager) {
    //res.send("mamager here");
    data_service.getEmployeesByManager(req.query.manager).then(function(data){
      if (data.length > 0) {
        res.render("employees", {employees: data});
      } else {
        res.render("employees", {message: "no results"});
      }
    }).catch(function(err){
      res.render("employees", {message: "no results"});
    })
  } else {
    //res.send("all employees here");;
    data_service.getAllEmployees().then(function(data){
      if (data.length > 0) {
        res.render("employees", {employees: data});
      } else {
        res.render("employees", {message: "no results"});
      }
    }).catch(function(err){
      res.render("employees", {message: "no results"});
    })
  }
});

/* // setup another route to listen on /employee/value
app.get("/employee/:num", function(req,res){
  //res.send("value!");
  data_service.getEmployeeByNum(req.params.num).then(function(data){
    //res.json(data);
    res.render("employee", { data: data });
  }).catch(function(err){
    //res.json({message: err});
    res.status(404).send("Employee Not Found");
  });
});
*/

app.get("/employee/:empNum", (req, res) => {
 
  // initialize an empty object to store the values
  let viewData = {};

  data_service.getEmployeeByNum(req.params.empNum).then((data) => {
      if (data) {
          viewData.employee = data; //store employee data in the "viewData" object as "employee"
      } else {
          viewData.employee = null; // set employee to null if none were returned
      }
  }).catch(() => {
      viewData.employee = null; // set employee to null if there was an error
  }).then(data_service.getDepartments)
  .then((data) => {
      viewData.departments = data; // store department data in the "viewData" object as "departments"

      // loop through viewData.departments and once we have found the departmentId that matches
      // the employee's "department" value, add a "selected" property to the matching
      // viewData.departments object

      for (let i = 0; i < viewData.departments.length; i++) {
          if (viewData.departments[i].departmentId == viewData.employee.department) {
              viewData.departments[i].selected = true;
          }
      }

  }).catch(() => {
      viewData.departments = []; // set departments to empty if there was an error
  }).then(() => {
      if (viewData.employee == null) { // if no employee - return an error
          res.status(404).send("Employee Not Found");
      } else {
          res.render("employee", { viewData: viewData }); // render the "employee" view
      }
  });
});

// setup route /employee/update for post method
app.post("/employee/update", (req, res) => {
  data_service.updateEmployee(req.body).then(function() {
    res.redirect("/employees");
  }).catch(function(err){
    console.log(err);
  });
});

// setup another route to listen on /managers
app.get("/managers", function(req,res){
  //res.send("manager!");
  data_service.getManagers().then(function(data){
    res.json(data);
  }).catch(function(err){
    res.json({message: err});
  });
});

// setup another route to listen on /departments
app.get("/departments", function(req,res){
  //res.send("no results!");
  data_service.getDepartments().then(function(data){
    if(data.length > 0){
    res.render("departments", {departments: data});;
    } else {
      res.render("departments", {message: "no results"}); 
    }
  }).catch(function(err){
    res.render("departments", {message: "no results"});
  });
});
 
// setup another route to listen on /employees/add
app.get("/employees/add", (req,res) => {
  data_service.getDepartments().then(function(data) {
    res.render("addEmployee", {departments: data});
    
  }).catch(function(err) {
    res.render("addEmployee", {departments: []});
  });
});

// setup another route to listen on /departments/add
app.get("/departments/add", (req,res) => {
  res.render("addDepartment");
});

// setup route /departments/add for post method
app.post("/departments/add", (req, res) => {
  data_service.addDepartment(req.body).then(function() {
    res.redirect("/departments");
  }).catch(function(err){
    console.log(err);
  });
});

// setup route /department/update for post method
app.post("/department/update", (req, res) => {
  data_service.updateDepartment(req.body).then(function() {
    res.redirect("/departments");
  }).catch(function(err){
    console.log(err);
  });
});

// setup another route to listen on /department/value
app.get("/department/:departmentId", function(req,res){
  //res.send("value!");
  data_service.getDepartmentById(req.params.departmentId).then(function(data){
    //res.json(data);
    res.render("department", { data: data });
  }).catch(function(err){
    //res.json({message: err});
    res.status(404).send("Department Not Found");
  });
});

// setup route /employee/delete/:num
app.get("/employee/delete/:empNum", function(req, res) {
  data_service.deleteEmployeeByNum(req.params.empNum).then(function() {
    res.redirect("/employees");
  }).catch(function(err) {
    res.status(500).send("Unable to Remove Employee / Employee not found");
  });
});

  // no matching route to listen
  app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });

// load the JSON firstly and then setup server
data_service.initialize().then(function() {
  // setup http server to listen on HTTP_PORT
  app.listen(HTTP_PORT, onHttpStart)
  }).catch(function(err) {
    console.log("Failed to start the sever - " + err);
  });





