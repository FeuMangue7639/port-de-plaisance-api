const express = require('express');
const Reservation = require('../models/Reservation');
const validateReservation = require('../middlewares/validation');
const authenticateToken = require('../middlewares/auth'); 

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Gestion des réservations
 */

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Récupérer toutes les réservations
 *     tags: [Reservations]
 *     responses:
 *       200:
 *         description: Liste des réservations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 */

// GET: Récupérer toutes les réservations
router.get('/', authenticateToken, async (req, res) => {
    try {
        const reservations = await Reservation.find();
        let html = `
            <html>
            <head><title>Liste des Réservations</title></head>
            <body>
                <h1>Liste des Réservations</h1>
                <ul>
        `;
        reservations.forEach(reservation => {
            html += `
                <li>
                    Catway #${reservation.catwayNumber} - Client : ${reservation.clientName} - Bateau : ${reservation.boatName}
                    (Du ${new Date(reservation.checkIn).toLocaleDateString()} au ${new Date(reservation.checkOut).toLocaleDateString()})
                </li>
            `;
        });
        html += `
                </ul>
            </body>
            </html>
        `;
        res.send(html);
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des réservations.');
    }
});

// GET: Récupérer une réservation par catwayNumber
router.get('/:catwayNumber', authenticateToken, async (req, res) => {
    try {
        const reservation = await Reservation.findOne({ catwayNumber: req.params.catwayNumber });
        if (!reservation) {
            return res.status(404).send(`
                <html>
                <head><title>Réservation non trouvée</title></head>
                <body>
                    <h1>Réservation non trouvée</h1>
                    <p>Aucune réservation pour le catway #${req.params.catwayNumber} n'a été trouvée.</p>
                </body>
                </html>
            `);
        }
        res.send(`
            <html>
            <head><title>Détails de la Réservation</title></head>
            <body>
                <h1>Détails de la Réservation</h1>
                <p>Catway #${reservation.catwayNumber}</p>
                <p>Client : ${reservation.clientName}</p>
                <p>Bateau : ${reservation.boatName}</p>
                <p>Date d’arrivée : ${new Date(reservation.checkIn).toLocaleDateString()}</p>
                <p>Date de départ : ${new Date(reservation.checkOut).toLocaleDateString()}</p>
                <a href="/reservations">Retour à la liste des réservations</a>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des détails de la réservation.');
    }
});


// POST: Ajouter une nouvelle réservation
router.post('/', [authenticateToken, validateReservation], async (req, res) => {
    try {
        const conflict = await Reservation.findOne({
            catwayNumber: req.body.catwayNumber,
            $or: [
                { checkIn: { $lt: req.body.checkOut, $gte: req.body.checkIn } },
                { checkOut: { $gt: req.body.checkIn, $lte: req.body.checkOut } },
                { checkIn: { $lte: req.body.checkIn }, checkOut: { $gte: req.body.checkOut } }
            ]
        });

        if (conflict) {
            return res.status(400).json({
                message: 'Conflit de réservation : un catway est déjà réservé pour cette période.'
            });
        }

        const newReservation = new Reservation(req.body);
        const savedReservation = await newReservation.save();
        res.status(201).json(savedReservation);
    } catch (error) {
        res.status(400).json({ message: 'Erreur lors de la création de la réservation', error });
    }
});

// PUT: Mettre à jour une réservation
router.put('/:catwayNumber', [authenticateToken, validateReservation], async (req, res) => {
    try {
        const conflict = await Reservation.findOne({
            catwayNumber: req.body.catwayNumber,
            _id: { $ne: req.params.id },
            $or: [
                { checkIn: { $lt: req.body.checkOut, $gte: req.body.checkIn } },
                { checkOut: { $gt: req.body.checkIn, $lte: req.body.checkOut } },
                { checkIn: { $lte: req.body.checkIn }, checkOut: { $gte: req.body.checkOut } }
            ]
        });

        if (conflict) {
            return res.status(400).json({
                message: 'Conflit de réservation : un catway est déjà réservé pour cette période.'
            });
        }

        const updatedReservation = await Reservation.findOneAndUpdate(
            { catwayNumber: req.params.catwayNumber },
            req.body,
            { new: true }
        );
        if (!updatedReservation) return res.status(404).json({ message: 'Réservation non trouvée' });
        res.status(200).json(updatedReservation);
    } catch (error) {
        res.status(400).json({ message: 'Erreur lors de la mise à jour de la réservation', error });
    }
});

// DELETE: Supprimer une réservation
router.delete('/:catwayNumber', authenticateToken, async (req, res) => {
    try {
        const deletedReservation = await Reservation.findOneAndDelete({ catwayNumber: req.params.catwayNumber });
        if (!deletedReservation) return res.status(404).json({ message: 'Réservation non trouvée' });
        res.status(200).json({ message: 'Réservation supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de la réservation', error });
    }
});

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       required:
 *         - catwayNumber
 *         - clientName
 *         - boatName
 *         - checkIn
 *         - checkOut
 *       properties:
 *         catwayNumber:
 *           type: integer
 *           description: Numéro du catway réservé
 *         clientName:
 *           type: string
 *           description: Nom du client
 *         boatName:
 *           type: string
 *           description: Nom du bateau
 *         checkIn:
 *           type: string
 *           format: date
 *           description: Date d'arrivée
 *         checkOut:
 *           type: string
 *           format: date
 *           description: Date de départ
 *       example:
 *         catwayNumber: 1
 *         clientName: John Doe
 *         boatName: Sea Breeze
 *         checkIn: "2024-11-20"
 *         checkOut: "2024-11-25"
 */


