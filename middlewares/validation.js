const Joi = require('joi');

// validation pour les réservations
const reservationSchema = Joi.object({
    catwayNumber: Joi.number().integer().required(),
    clientName: Joi.string().min(3).max(50).required(),
    boatName: Joi.string().min(3).max(50).required(),
    checkIn: Joi.date().required(),
    checkOut: Joi.date().min(Joi.ref('checkIn')).required(),
});

// Middleware pour valider les données des requêtes
const validateReservation = (req, res, next) => {
    const { error } = reservationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: 'Validation error', details: error.details });
    }
    next();
};

module.exports = validateReservation;
