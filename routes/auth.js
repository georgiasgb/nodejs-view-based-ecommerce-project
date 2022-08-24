const express = require('express');
const router = express.Router();
const { check, body } = require('express-validator');

const authController = require('../controllers/auth_controller');
const User = require('../models/user_model');



router.get('/signup', authController.getSignup);
router.post('/signup', 
    check('email').isEmail().withMessage('Please enter a valid email.').custom((value) => {
        return User.findOne({uEmail: value}).then(user => {
            if (user) {
                return Promise.reject('E-mail already in use');
            } 
        }).catch((err) => {throw Error(err)});
    }).normalizeEmail(), 
    body('name').isString().withMessage('Please enter a valid name.'),
    body('password', 'Please enter a password with at least 5 characters').isLength({ min: 5 }).trim(),
    body('confirmPassword').trim().custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password Confirmation does not match Password');
        }
        return true;
    }), 
    authController.postSignup
); 

router.get('/login', authController.getLogin);
router.post('/login',
    check('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
    body('password', 'Invalid password').isLength({ min: 5 }).trim(), 
    authController.postLogin
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);
router.post('/reset', 
    check('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
    authController.postReset
);

router.get('/new-password/:token', authController.getNewPassword);
router.post('/new-password',
    body('password', 'Please enter a password with at least 5 characters').isLength({ min: 5 }).trim(), 
    authController.postNewPassword
);

module.exports = router; 