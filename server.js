const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const PORT = 3056;
const db = new sqlite3.Database("./bdd");
const cors = require("cors");

// CORS
app.use(cors({
    origin: '*'
}));

// Middleware pour analyser les corps JSON
app.use(express.json());

// Middleware pour analyser les formulaires URL-encodés
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send("App is alive");
})

// Endpoint liste des films en lice pour une catégorie (null = liste de tout les films des oscars) (category_id)
app.get('/movies/bycategory/:categoryid', (req, res) => {
    const category_id = req.params.categoryid;
    let query = "SELECT (movie_id) from movies";

    if(category_id !== 0) {
       query = `SELECT m.movie_id, m.movie_name, cm.categories_movies_id, cm.is_winner 
        from categories_movies cm 
        inner join movies m on m.movie_id = cm.movie_id 
        where cm.category_id = ${category_id}`; 
    }

    db.all(query, (err, rows) => {
        if(err) {
            console.error(err);
            res.status(400).send({error: "Impossible de récupérer les films."});
            return;
        }
        res.send({movies: rows});
    });
});

// Endpoint liste catégories
app.get("/categories", (req, res) => {
    const query = "SELECT * from categories order by category_id desc";
    db.all(query, (err, rows) => {
        if(err) {
            console.error(err);
            res.status(400).send({error: "Impossible de récupérer les catégories."});
            return;
        }
        res.send({categories: rows});
    });
});

// Endpoint mettre en winner un film (categorye_movie_id)
app.patch("/makewinner/:moviecategoryid", (req, res) => {
    const movie_category_id = req.params.moviecategoryid;
    let query = `UPDATE categories_movies set is_winner = 1 where categories_movies_id = ${movie_category_id}`;

    db.run(query, (err) => {
        if(err) {
            console.error(err);
            res.status(400).send({error: "Impossible de mettre à jour le gagnant."});
            return;
        }
        res.send({message: "Gagnant mis à jour."});
    });
});

// Endpoint créer un joueur
app.post("/player", (req, res) => {
    const player_name = req.body.player_name;
    if(!Boolean(player_name)) {
        req.status(400).send({error: "Impossible d'enregistrer le joueur."});
        return;
    }
    const query = `INSERT INTO players (player_name) values ('${player_name}')`;

    db.run(query, function (err) {
        if(err) {
            console.error(err);
            res.status(500).send({error: "Impossible d'ajouter le joueur."});
            return;
        }
        res.send({ player_id: this.lastID });
    });
});

// Endpoint faire un guess (joueur, category_movie_id)
app.post("/player/guess/:playerid/:moviecategoryid", (req, res) => {
    const player_id = req.params.playerid;
    const movie_category_id = req.params.moviecategoryid;
    const query = `INSERT INTO player_guess (player_id, category_movie_id) values (${player_id}, ${movie_category_id})`;
    
    db.run(query, (err) => {
        if(err) {
            console.error(err);
            res.status(500).send({error: "Impossible d'ajouter le guess."});
            return;
        }
        res.send({message: "Guess ajouté avec succès"});
    });
});


app.get("/stats", (req, res) => {
    const query = "SELECT p.player_id, p.player_name, SUM(cm.is_winner) as score  FROM player_guess pg\
        inner join players p on pg.player_id = p.player_id\
        inner join categories_movies cm on pg.category_movie_id = cm.categories_movies_id\
        where cm.is_winner = 1\
        group by pg.player_id\
        order by score desc";
    
    db.all(query, (err, rows) => {
        if(err) {
            console.error(err);
            res.status(400).send({error: "Impossible de récupérer les stats."});
            return;
        }
        res.send(rows);
    });
});

app.listen(PORT, () => {
    console.log(`OscarzGame is listening on ${PORT}`);
})