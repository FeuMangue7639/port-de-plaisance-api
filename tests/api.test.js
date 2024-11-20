const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server'); 
const should = chai.should();
const Catway = require('../models/Catway');

chai.use(chaiHttp);

beforeEach(async () => {
    await Catway.deleteMany({});
});

describe('Catways', () => {
    it('should GET all the catways', (done) => {
        chai.request(app)
            .get('/catways')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                done();
            });
    });

    it('should POST a new catway', (done) => {
        const catway = { catwayNumber: 2, type: 'short', catwayState: 'Disponible' };
        chai.request(app)
            .post('/catways')
            .send(catway)
            .end((err, res) => {
                res.should.have.status(201); 
                res.body.should.be.a('object');
                res.body.should.have.property('catwayNumber').eql(2);
                done();
            });
    });

    it('should GET a catway by catwayNumber', (done) => {
        const catway = new Catway({ catwayNumber: 3, type: 'long', catwayState: 'Disponible' });
        catway.save().then(() => {
            chai.request(app)
                .get('/catways/3')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('catwayNumber').eql(3);
                    done();
                });
        });
    });

    it('should DELETE a catway', (done) => {
        const catway = new Catway({ catwayNumber: 4, type: 'short', catwayState: 'Disponible' });
        catway.save().then(() => {
            chai.request(app)
                .delete('/catways/4')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('message').eql('Catway supprimé avec succès');
                    done();
                });
        });
    });
});
