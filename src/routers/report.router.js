const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const reportController = require('../controllers/report.controller');

router.use(protect);

router.post('/',
    validate([
        body('reported_entity_type').isIn(['song', 'post', 'user', 'group']).withMessage('Invalid entity type.'),
        body('reported_entity_id').isInt().withMessage('Entity ID must be an integer.'),
        body('reason').notEmpty().withMessage('Reason for reporting is required.')
    ]),
    reportController.createReport
);

module.exports = router;