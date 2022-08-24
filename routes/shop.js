const express = require('express');
const router = express.Router();

const isAuth = require('../middleware/isAuth');
const shopControllers = require('../controllers/shop_controllers');

router.get('/', shopControllers.getHomeIndex);

router.get('/products-list', shopControllers.getProducts);

router.get('/product-detail/:productId', shopControllers.getProductDetail);

router.get('/cart', isAuth, shopControllers.getShopCart);

router.post('/cart', isAuth, shopControllers.postShopCart);

router.post('/cart/delete-cart-item/:productId', isAuth, shopControllers.deleteShopCartItem)

router.get('/checkout', isAuth, shopControllers.getCheckout);

router.get('/checkout/cancel', isAuth, shopControllers.getCheckout);

router.get('/checkout/success', isAuth, shopControllers.postOrder);

router.get('/orders', isAuth, shopControllers.getOrders);

router.get('/orders/:orderId', isAuth, shopControllers.getInvoice);
 
module.exports = router;