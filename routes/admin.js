const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const isAuth = require('../middleware/isAuth');
const adminProductControllers = require('../controllers/admin_products_controllers');

router.get('/products-admin-list', adminProductControllers.getProductsAdminList);

router.get('/add-product', isAuth, adminProductControllers.getAddProduct);
router.post('/add-product', isAuth, 
    body('pName').isString().trim().isLength({min: 3}),
    body('pPrice').isFloat(),
    body('pDescription').trim().isLength({min: 5, max: 400}),
    adminProductControllers.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminProductControllers.getEditProduct);

router.post('/update-product/:productId', isAuth,  
    body('pName').isString().trim().isLength({min: 3}),
    body('pPrice').isFloat(),
    body('pDescription').trim().isLength({min: 5, max: 400}),
    adminProductControllers.postUpdateProduct
);

router.delete('/delete-product/:productId', isAuth, adminProductControllers.deleteProduct);

module.exports = router