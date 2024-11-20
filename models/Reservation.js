const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    catwayNumber: { type: Number, required: true },
    clientName: { type: String, required: true },
    boatName: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
});

module.exports = mongoose.model('Reservation', ReservationSchema);
