const jwt = require('jsonwebtoken');

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']; // Récupère le token dans le header
    const token = authHeader && authHeader.split(' ')[1]; // Format "Bearer TOKEN"

    if (!token) return res.status(401).json({ message: 'Accès refusé : Token manquant.' });

    // Vérifie et décode le token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token invalide.' });

        req.user = user; // Ajoute l'utilisateur au requête
        next();
    });
};

module.exports = authenticateToken;
