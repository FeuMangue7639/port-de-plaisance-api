const express = require('express');
const Catway = require('../models/Catway');
const authenticateToken = require('../middlewares/auth'); 

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Catways
 *   description: Gestion des catways
 */

/**
 * @swagger
 * /catways:
 *   get:
 *     summary: Récupérer tous les catways
 *     tags: [Catways]
 *     responses:
 *       200:
 *         description: Liste des catways.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Catway'
 */
// GET: Récupérer tous les catways
router.get('/', authenticateToken, async (req, res) => {
    try {
        const catways = await Catway.find();
        let html = `
            <html>
            <head><title>Liste des Catways</title></head>
            <body>
                <h1>Liste des Catways</h1>
                <ul>
        `;
        catways.forEach(catway => {
            html += `<li>Catway #${catway.catwayNumber} - ${catway.type} - ${catway.catwayState}</li>`;
        });
        html += `
                </ul>
            </body>
            </html>
        `;
        res.send(html);
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des catways.');
    }
});

// GET: Récupérer un catway par son numéro
router.get('/:catwayNumber', authenticateToken, async (req, res) => {
    try {
        const catway = await Catway.findOne({ catwayNumber: req.params.catwayNumber });
        if (!catway) {
            return res.status(404).send(`
                <html>
                <head><title>Catway non trouvé</title></head>
                <body>
                    <h1>Catway non trouvé</h1>
                    <p>Aucun catway correspondant au numéro ${req.params.catwayNumber} n'a été trouvé.</p>
                </body>
                </html>
            `);
        }
        res.send(`
            <html>
            <head><title>Détails du Catway</title></head>
            <body>
                <h1>Détails du Catway</h1>
                <p>Catway #${catway.catwayNumber}</p>
                <p>Type : ${catway.type}</p>
                <p>État : ${catway.catwayState}</p>
                <a href="/catways">Retour à la liste des catways</a>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des détails du catway.');
    }
});

// POST: Ajouter un nouveau catway
router.post('/', authenticateToken, async (req, res) => {
    try {
        const newCatway = new Catway(req.body);
        const savedCatway = await newCatway.save();
        res.status(201).json(savedCatway);
    } catch (error) {
        res.status(400).json({ message: 'Erreur lors de la création du catway', error });
    }
});

// PUT: Mettre à jour un catway
router.put('/:catwayNumber', authenticateToken, async (req, res) => {
    try {
        const updatedCatway = await Catway.findOneAndUpdate(
            { catwayNumber: req.params.catwayNumber },
            req.body,
            { new: true }
        );
        if (!updatedCatway) return res.status(404).json({ message: 'Catway non trouvé' });
        res.status(200).json(updatedCatway);
    } catch (error) {
        res.status(400).json({ message: 'Erreur lors de la mise à jour du catway', error });
    }
});

// DELETE: Supprimer un catway
router.delete('/:catwayNumber', authenticateToken, async (req, res) => {
    try {
        const deletedCatway = await Catway.findOneAndDelete({ catwayNumber: req.params.catwayNumber });
        if (!deletedCatway) return res.status(404).json({ message: 'Catway non trouvé' });
        res.status(200).json({ message: 'Catway supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du catway', error });
    }
});

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Catway:
 *       type: object
 *       required:
 *         - catwayNumber
 *         - type
 *         - catwayState
 *       properties:
 *         catwayNumber:
 *           type: integer
 *           description: Numéro unique du catway
 *         type:
 *           type: string
 *           description: Type du catway (long ou short)
 *         catwayState:
 *           type: string
 *           description: État du catway (Disponible ou Indisponible)
 *       example:
 *         catwayNumber: 1
 *         type: long
 *         catwayState: Disponible
 */

