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

app.use(cors());

app.use(cookieParser());

app.use(session({
    secret: 'Oursecret',
    resave: false,
    saveUninitialized: true
  }))

 app.use(passport.initialize());
 app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/taskflow", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    name : String,
    username: String,
    email:String,
    password: String

});

userSchema.plugin(passportLocalMongoose,{ usernameField: 'email' });


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.post('/signup', function (req, res) {




    User.register({ email: req.body.email }, req.body.password, function (err, user) {

        if (err) {
            console.log(err);
            res.status(400).send({ success: false, message: 'Erreur lors de l\'inscription' });
        }
        else {
            passport.authenticate("local")(req, res, function () {

                // const secretKey = process.env.SECRET_KEY;

                // const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

                // res.cookie('authCookie', token, { maxAge: 3600000, httpOnly: false, secure: false });

                // console.log()

                // Envoyer le JWT dans la réponse
                res.cookie('monCookie', 'valeurDuCookie', { maxAge: 3600000, httpOnly: true });
                res.send('Cookie défini !');
                console.log(res);
                
                //res.send({ success: true, message: 'Inscription réussie' });
            });
        }

    })

})



app.listen(4000, function () {
    console.log("Server is running");
});