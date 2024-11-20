const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const authenticateToken = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Ajouter un nouvel utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès.
 *       400:
 *         description: Erreur lors de la création de l'utilisateur.
 */
router.post('/', async (req, res) => {
    const { username, email, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ message: 'Nom d\'utilisateur, e-mail et mot de passe requis.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash du mot de passe
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Utilisateur créé avec succès.', user: { username, email } });
    } catch (error) {
        res.status(400).json({ message: 'Erreur lors de la création de l\'utilisateur.', error });
    }
});

/**
 * @swagger
 * /users/{username}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: Nom de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès.
 *       404:
 *         description: Utilisateur non trouvé.
 */
router.delete('/:username', authenticateToken, async (req, res) => {
    try {
        const deletedUser = await User.findOneAndDelete({ username: req.params.username });
        if (!deletedUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        res.status(200).json({ message: 'Utilisateur supprimé avec succès.', deletedUser });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur.', error });
    }
});

/**
 * @swagger
 * /users/{username}:
 *   get:
 *     summary: Récupérer les détails d’un utilisateur
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: Nom de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur.
 *       404:
 *         description: Utilisateur non trouvé.
 */
router.get('/:username', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        res.status(200).json({ username: user.username, email: user.email });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur.', error });
    }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupérer la liste de tous les utilisateurs
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Liste des utilisateurs.
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({}, 'username email');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.', error });
    }
});

module.exports = router;

