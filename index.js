require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');


const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));

app.use(cors({
    origin:"http://localhost:3000",
    credentials:true
}));



app.use(session({
    secret: 'Oursecret',
    resave: false,
    saveUninitialized: true
  }))

app.use(cookieParser('Oursecret'));

 app.use(passport.initialize());
 app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/taskflow", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    name : String,
    username:String,
    email:String,
    password: String
 
});

userSchema.plugin(passportLocalMongoose,{ usernameField: 'email' });


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.post('/signup', function (req, res) {

    const newUser = new User({
        name:req.body.name,
        username: req.body.username, 
        email: req.body.email
      });
      console.log(newUser)

    User.register( newUser , req.body.password, function (err, user) {

        if (err) {
            console.log(err);
            res.status(400).send({ success: false, message: 'Erreur lors de l\'inscription' });
        }
        else {
            passport.authenticate("local")(req, res, function () {

               
                res.send({ success: true, message: 'Inscription réussie' });
            });
        }

    })

})

app.post('/login', function (req, res) {


    const user = new User({
        email:req.body.email,
        password:req.body.password
    })

    req.login(user, function(err) {
        if (err) {
             console.log(err);
             console.log("Is Not logged")

             }
        else {
            passport.authenticate("local")(req,res,function(){
                
                res.send("Success")
            });
        }
      });

})

app.get('/logout', function (req, res) {

    req.logout(function (err) {
        if (err) {
            console.log(err);
        }
        else {

            res.send("Success");

        }
    });

});



app.get('/user', function (req, res) {

res.send(req.user)

});

app.listen(4000, function () {
    console.log("Server is running");
});