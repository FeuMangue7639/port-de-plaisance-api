/**
 * @file Server.js
 * @description Point d'entrée principal de l'application. Configure Express, MongoDB, Swagger et les routes principales.
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const catwayRoutes = require('./routes/catwayRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const jwt = require('jsonwebtoken');

/**
 * Instance principale de l'application Express.
 * @type {Express}
 */
const app = express();
app.use(bodyParser.json());

/**
 * @function
 * @description Connecte l'application à MongoDB.
 * @returns {Promise<void>} Promise résolue si la connexion est réussie.
 */
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

/**
 * Route de base pour vérifier le fonctionnement du serveur.
 * @name GET /
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Objet de la requête.
 * @param {Object} res - Objet de la réponse.
 * @returns {String} Message de bienvenue.
 */

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Accueil - Port de Plaisance</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                }
                h1 {
                    color: #333;
                }
                form {
                    margin-top: 20px;
                }
                input[type="text"], input[type="password"] {
                    padding: 10px;
                    margin: 5px 0;
                    width: 100%;
                    max-width: 300px;
                }
                button {
                    padding: 10px 15px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                }
                button:hover {
                    background-color: #0056b3;
                }
                a {
                    margin-top: 20px;
                    text-decoration: none;
                    color: #007bff;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <h1>Bienvenue à l'API du port de plaisance de Russell</h1>
            <p>Gérez vos catways et réservations facilement avec notre API.</p>

            <!-- Formulaire de connexion -->
            <form action="/login" method="POST">
                <input type="text" name="username" placeholder="Nom d'utilisateur" required>
                <input type="password" name="password" placeholder="Mot de passe" required>
                <button type="submit">Se connecter</button>
            </form>

            <!-- Lien vers la documentation -->
            <a href="/api-docs" target="_blank">Voir la documentation de l'API</a>
        </body>
        </html>
    `);
});


/**
 * Route de test pour la création de modèles `Catway` et `Reservation`.
 * @name GET /test-models
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Objet de la requête.
 * @param {Object} res - Objet de la réponse.
 * @returns {Object} Les objets créés pour le test.
 */
app.get('/test-models', async (req, res) => {
    try {
        const catway = await Catway.create({
            catwayNumber: 1,
            type: 'long',
            catwayState: 'Disponible',
        });

        const reservation = await Reservation.create({
            catwayNumber: 1,
            clientName: 'John Doe',
            boatName: 'Sea Breeze',
            checkIn: new Date('2024-11-20'),
            checkOut: new Date('2024-11-25'),
        });

        res.json({ catway, reservation });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur lors de la création des modèles.');
    }
});

/**
 * Route pour générer un token JWT à partir d'un nom d'utilisateur.
 * @name POST /login
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Objet de la requête.
 * @param {Object} res - Objet de la réponse.
 * @returns {Object} Le token JWT.
 */
app.post('/login', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: 'Nom d\'utilisateur requis.' });
    }

    const user = { name: username };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

    res.json({ accessToken });
});

/**
 * Route pour afficher le formulaire de connexion.
 * @name GET /login
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Objet de la requête.
 * @param {Object} res - Objet de la réponse.
 * @returns {HTML} Le fichier `login.html`.
 */
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

/**
 * Route pour authentifier un utilisateur et générer un token JWT.
 * @name POST /login
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Objet de la requête.
 * @param {Object} res - Objet de la réponse.
 * @returns {Object} Le token JWT.
 */
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(403).json({ message: 'Mot de passe incorrect.' });
        }

        const accessToken = jwt.sign({ name: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        res.json({ accessToken });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la connexion.', error });
    }
});

/**
 * Documentation Swagger.
 * @type {Object}
 */
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Port de Plaisance API',
            version: '1.0.0',
            description: 'API pour la gestion des catways et des réservations dans le port de plaisance.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * Inclusion des routes principales.
 */
app.use('/catways', catwayRoutes);
app.use('/reservations', reservationRoutes);
const userRoutes = require('./routes/userRoutes'); // Import des routes utilisateurs
app.use('/users', userRoutes);

/**
 * Démarrage du serveur.
 * @name start
 * @function
 * @description Démarre le serveur sur le port spécifié dans `.env` ou 3000 par défaut.
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const authenticateToken = require('./middlewares/auth'); // Middleware d'authentification JWT

app.get('/dashboard', authenticateToken, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tableau de Bord</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    padding: 20px;
                }
                form {
                    margin-bottom: 20px;
                    padding: 10px;
                    background: #fff;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }
                input, button {
                    margin: 5px 0;
                    padding: 10px;
                    width: 100%;
                    box-sizing: border-box;
                }
                h1, h2 {
                    color: #333;
                }
                a {
                    display: inline-block;
                    margin-top: 10px;
                    color: #007BFF;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <h1>Tableau de Bord</h1>
            <p>Bienvenue, ${req.user.name} !</p>

            <h2>Gestion des utilisateurs</h2>
            <!-- Formulaire pour créer un utilisateur -->
            <form method="POST" action="/users">
                <h3>Créer un utilisateur</h3>
                <input type="text" name="username" placeholder="Nom d'utilisateur" required>
                <input type="password" name="password" placeholder="Mot de passe" required>
                <input type="email" name="email" placeholder="Email" required>
                <button type="submit">Créer</button>
            </form>

            <!-- Formulaire pour modifier un utilisateur -->
            <form method="PUT" action="/users/:id">
                <h3>Modifier un utilisateur</h3>
                <input type="text" name="id" placeholder="ID de l'utilisateur" required>
                <input type="text" name="username" placeholder="Nouveau nom d'utilisateur">
                <input type="password" name="password" placeholder="Nouveau mot de passe">
                <input type="email" name="email" placeholder="Email" required>
                <button type="submit">Modifier</button>
            </form>

            <!-- Formulaire pour afficher les détails d'un utilisateur -->
            <form method="GET" action="/users/:id">
                <h3>Afficher un utilisateur</h3>
                <input type="text" name="id" placeholder="ID de l'utilisateur" required>
                <button type="submit">Afficher</button>
            </form>

            <!-- Formulaire pour supprimer un utilisateur -->
            <form method="DELETE" action="/users/:id">
                <h3>Supprimer un utilisateur</h3>
                <input type="text" name="id" placeholder="ID de l'utilisateur" required>
                <button type="submit">Supprimer</button>
            </form>

            <h2>Gestion des catways</h2>
            <!-- Formulaire pour créer un catway -->
            <form method="POST" action="/catways">
                <h3>Créer un catway</h3>
                <input type="number" name="catwayNumber" placeholder="Numéro du catway" required>
                <input type="text" name="type" placeholder="Type (long/short)" required>
                <input type="text" name="catwayState" placeholder="État (Disponible/Indisponible)" required>
                <button type="submit">Créer</button>
            </form>

            <!-- Formulaire pour modifier un catway -->
            <form method="PUT" action="/catways/:id">
                <h3>Modifier un catway</h3>
                <input type="text" name="id" placeholder="ID du catway" required>
                <input type="text" name="catwayState" placeholder="Nouvel état">
                <button type="submit">Modifier</button>
            </form>

            <!-- Formulaire pour supprimer un catway -->
            <form method="DELETE" action="/catways/:id">
                <h3>Supprimer un catway</h3>
                <input type="text" name="id" placeholder="ID du catway" required>
                <button type="submit">Supprimer</button>
            </form>

            <!-- Formulaire pour afficher les détails d'un catway -->
            <form method="GET" action="/catways/:id">
                <h3>Afficher un catway</h3>
                <input type="text" name="id" placeholder="ID du catway" required>
                <button type="submit">Afficher</button>
            </form>

            <h2>Gestion des réservations</h2>
            <!-- Formulaire pour créer une réservation -->
            <form method="POST" action="/reservations">
                <h3>Créer une réservation</h3>
                <input type="number" name="catwayNumber" placeholder="Numéro du catway" required>
                <input type="text" name="clientName" placeholder="Nom du client" required>
                <input type="text" name="boatName" placeholder="Nom du bateau" required>
                <input type="date" name="checkIn" placeholder="Date d'arrivée" required>
                <input type="date" name="checkOut" placeholder="Date de départ" required>
                <button type="submit">Créer</button>
            </form>

            <!-- Formulaire pour supprimer une réservation -->
            <form method="DELETE" action="/reservations/:id">
                <h3>Supprimer une réservation</h3>
                <input type="text" name="id" placeholder="ID de la réservation" required>
                <button type="submit">Supprimer</button>
            </form>

            <!-- Formulaire pour afficher les détails d'une réservation -->
            <form method="GET" action="/reservations/:id">
                <h3>Afficher une réservation</h3>
                <input type="text" name="id" placeholder="ID de la réservation" required>
                <button type="submit">Afficher</button>
            </form>

            <h2>Liens rapides</h2>
            <a href="/catways">Liste des catways</a><br>
            <a href="/reservations">Liste des réservations</a><br>
            <a href="/api-docs">Documentation de l'API</a>
        </body>
        </html>
    `);
});



module.exports = app;
