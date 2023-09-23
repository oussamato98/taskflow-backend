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


app.get("/users",function(req,res){

    User.find({})
    .then((rs) => res.send(rs))
    .catch((err) => res.send(err));
})

app.get("/users/:id", function (req, res) {
    const userId = req.params.id;

    // Utilisez la méthode findOne pour trouver l'utilisateur par son ID
    User.findOne({ _id: userId })
        .then((user) => {
            if (user) {
                // Si l'utilisateur est trouvé, renvoyez-le en réponse
                res.status(200).json(user);
            } else {
                // Si l'utilisateur n'est pas trouvé, renvoyez une réponse appropriée
                res.status(404).json({ message: "Utilisateur non trouvé" });
            }
        })
        .catch((err) => {
            console.error("Erreur lors de la recherche de l'utilisateur par ID :", err);
            res.status(500).json({ error: "Erreur lors de la recherche de l'utilisateur par ID" });
        });
});





app.route("/projects")

    // .get((req, res) => {
    //     Projet.find({})
    //         .then((rs) => res.send(rs))
    //         .catch((err) => res.send(err));
    // })

    .get((req,res)=>{
        const userId = req.query.userId;
       
            // Si userId est fourni en tant que paramètre de requête, filtrez par utilisateur
            Projet.find({ 'chef._id': userId  })
              .then((projects) => {
                res.json(projects);
              })
              .catch((error) => {
                console.error("Erreur lors de la récupération des projets :", error);
                res.status(500).json({ message: "Erreur lors de la récupération des projets" });
              });
          
        console.log(userId);
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
    })

    .patch(function(req,res){

        const projectId = req.params.id ; // Remplacez par l'ID du projet
        const taskId = req.body.tache; // Remplacez par l'ID de la tâche à supprimer
        
        // Utilisez findOneAndUpdate pour mettre à jour le projet
        Projet.findOneAndUpdate(
          { _id: projectId }, // Filtre pour trouver le projet par ID
          { $pull: { tache: taskId } }, // Utilisez $pull pour supprimer l'ID de la tâche du tableau de tâches
          { new: true } // Cela renverra le projet mis à jour
        )
          .then((projet) => {
            if (!projet) {
              // Gérez le cas où le projet n'a pas été trouvé
              console.log("Projet non trouvé");
              return res.status(404).json({ message: "Projet non trouvé" });
            }
        
            // Le projet a été mis à jour avec la tâche supprimée
            console.log("Tâche supprimée avec succès");
            res.status(200).json({ message: "Tâche supprimée avec succès", projet });
          })
          .catch((err) => {
            // Gérez les erreurs éventuelles
            console.error("Erreur lors de la suppression de la tâche", err);
            res.status(500).json({ error: "Erreur lors de la suppression de la tâche" });
          });
                 
    })

// Modifiez votre route /projects pour renvoyer les projets de l'utilisateur authentifié





// Route pour mettre à jour un projet avec une nouvelle tâche
app.patch("/projectsupdate/:projectId", function (req, res) {
    const projectId = req.params.projectId;

    // Récupérez les données du projet à partir du corps de la requête
    const updatedProject = req.body;

    // Effectuez la mise à jour du projet dans votre base de données en utilisant l'ID du projet
    Projet.findByIdAndUpdate(
        projectId,
        updatedProject,
        { new: true }) // Ceci renvoie le projet mis à jour après la mise à jour
        .then((rs) => res.status(200).json(updatedProject))
        .catch((err) => res.status(500).json({ error: "Erreur lors de la mise à jour du projet" }))
          
    
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

    .patch(function (req, res) {
        const { id } = req.params;
        const  nouvelEtat  = req.body.etat;
        console.log(nouvelEtat)

        Tache.findById(id)
            .then((tache) => {
                if (!tache) {
                    return res.status(404).send("Tâche introuvable");
                }

                // Mettez à jour l'état de la tâche
                tache.etat = nouvelEtat;
                console.log(tache.etat)
                tache.save()
                    .then(() => res.status(200).send("État de la tâche mis à jour avec succès"))
                    .catch((err) => res.status(500).send(err));
            })
            .catch((err) => res.status(500).send(err));
    })

    .delete(function (req, res) {
        Tache.deleteOne({ _id: req.params.id })
            .then((rs) => res.status(204).send("success"))
            .catch((err) => res.send(err));
    });






app.listen(4000, function () {
    console.log("Server is running");
});
