require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const cors = require("cors");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));

app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
);

app.use(
    session({
        secret: "Oursecret",
        resave: false,
        saveUninitialized: true,
    })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/taskflow", {
    useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    email: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const etatsProjet = ["actif", "termine", "annule"];

const projetSchema = new mongoose.Schema({
    nom: String,
    evolution: Number,
    etat: {
        type: String,
        enum: etatsProjet,
        default: "actif", // Vous pouvez définir une valeur par défaut si nécessaire
    },
    dateDebut: String,
    dateFin: String,
    chef: {
        type: userSchema, // Utilisation du schéma de l'utilisateur comme sous-schéma
        default: null, // Vous pouvez définir une valeur par défaut si nécessaire
    },
    tache: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tache'
    }],
    
});

const Projet = mongoose.model("Projet", projetSchema);

const etatsTache = ["todo", "doing", "tovalidate","done"];

const tacheSchema = new mongoose.Schema({
    titre: String,
    contenu: String,
    etat: {
        type: String,
        enum: etatsTache,
        default: "todo", 
    },
    dateDebut: String,
    dateFin: String,
    evolution:Number,
    priorite:Number,
    
    executeur: {
        type: userSchema, // Utilisation du schéma de l'utilisateur comme sous-schéma
        default: null, // Vous pouvez définir une valeur par défaut si nécessaire
    },
    projet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Projet'
    }
});
const Tache = mongoose.model("Tache", tacheSchema);



/////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/signup", function (req, res) {
    const newUser = new User({
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
    });
    console.log(newUser);

    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.status(400).send({
                success: false,
                message: "Erreur lors de l'inscription",
            });
        } else {
            passport.authenticate("local")(req, res, function () {
                res.send({ success: true, message: "Inscription réussie" });
            });
        }
    });
});

app.post("/login", function (req, res) {
    const user = new User({
        email: req.body.email,
        password: req.body.password,
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
            console.log("Is Not logged");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.send("Success");
            });
        }
    });
});

app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.send("Success");
        }
    });
});

app.get("/user", function (req, res) {
    res.send(req.user);
});

app.route("/projects")

    .get((req, res) => {
        Projet.find({})
            .then((rs) => res.send(rs))
            .catch((err) => res.send(err));
    })

    .post((req, res) => {
        let dateD = new Date(req.body.dateDebut).toLocaleDateString();
        let dateF = new Date(req.body.dateFin).toLocaleDateString();
        console.log(req.user);

        const nouveauProjet = new Projet({
            nom: req.body.nom,
            evolution: req.body.evolution,
            etat: req.body.eta, // Vous pouvez envoyer l'état depuis le corps de la requête
            dateDebut: dateD,
            dateFin: dateF,
            chef: req.body.chef,
            tache: req.body.tache,
        });
        console.log(nouveauProjet);
        nouveauProjet
            .save()
            .then(() => {
                res.status(201).json({ nouveauProjet });
            })
            .catch((err) => {
                console.error("Erreur lors de l'ajout du projet", err);
                res.status(500).json({
                    error: "Erreur lors de l'ajout du projet",
                });
            });
    });

app.route("/projects/:id")

    .get(function (req, res) {
        Projet.find({ _id: req.params.id })
            .then((rs) => res.send(rs))
            .catch((err) => res.send(err));
    })

    .delete(function (req, res) {
        Projet.deleteOne({ _id: req.params.id })
            .then((rs) => res.status(204).send("success"))
            .catch((err) => res.send(err));
    });



app.route("/taches")

    .get(function (req, res) {

        Tache.find({})
            .then((rs) =>
                res.send(rs)
            )
            .catch((err) =>
                res.send(err));

    })

    .post(function (req, res) {

        let dateD = new Date(req.body.dateDebut).toLocaleDateString();
        let dateF = new Date(req.body.dateFin).toLocaleDateString();

        const nouveauTache = new Tache( {
            titre: req.body.titre,
            contenu: req.body.contenu,
            etat: req.body.eta,
            dateDebut: dateD,
            dateFin: dateF,
            evolution:req.body.evolution,
            priorite:req.body.priorite,
            executeur: req.body.executeur,
            projet: req.body.projet
        })
        console.log(nouveauTache)
        nouveauTache
        .save()
        .then(() => {
            res.status(201).json({ nouveauTache });
        })
        .catch((err) => {
            console.error("Erreur lors de l'ajout de la tache", err);
            res.status(500).json({
                error: "Erreur lors de l'ajout de la tache",
            });
        });


    })

app.route("/taches/:id")

    .get(function (req, res) {
        Tache.find({ _id: req.params.id })
            .then((rs) => res.send(rs))
            .catch((err) => res.send(err));
    })

    .delete(function (req, res) {
        Tache.deleteOne({ _id: req.params.id })
            .then((rs) => res.status(204).send("success"))
            .catch((err) => res.send(err));
    });






app.listen(4000, function () {
    console.log("Server is running");
});
