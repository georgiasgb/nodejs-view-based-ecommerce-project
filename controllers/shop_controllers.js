const Product = require('../models/product_model');
const Order = require('../models/order_model');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const ITEMS_PER_PAGE = 2;

const stripe = require('stripe')('INSERT YOUR STRIPE PRIVATE KEY'); 

const getHomeIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find()
    .countDocuments().then(totalProducts => {
        totalItems = totalProducts;
        return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .populate('userId', 'uName')
    }).then(products => {
        res.render('shop/products-list', {prods:products, docTitle: "My Shop Home",  path: '/',
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE), hasNextPage: ITEMS_PER_PAGE * page < totalItems, 
        nextPage: page + 1, hasPreviousPage: page > 1, previousPage: page - 1, currentPage: page });
    }).catch(err => next(err)) 
}

const getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find()
    .countDocuments()
    .then(totalProducts => {
        totalItems = totalProducts;
        return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    }).then(products => {
        res.render('shop/products-list', {prods: products, docTitle: "Shop Products",  path: '/products-list',
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE), hasNextPage: ITEMS_PER_PAGE * page < totalItems, 
        nextPage: page + 1, hasPreviousPage: page > 1, previousPage: page - 1, currentPage: page});
    }).catch(err => next(err))
}

const getProductDetail = (req, res, next) => {
    const productId = req.params.productId;
    Product.findById(productId)
    .then((product) => {
        if(!product) { 
            return res.redirect('/products-list');
        }
        res.render('shop/product-detail', {product:product, docTitle: "Detail",  path: '/products-list'}); 
    }).catch(err => next(err))
}

const getShopCart = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .then(userData => { 
        const cartItems = userData.cart.items;
        res.render('shop/cart', {cart: cartItems , docTitle: "Cart",  path: '/cart'})})
    .catch(err => next(err))
}

const postShopCart = (req, res, next) => {
    const productId = req.body.productId;
    Product.findById(productId).then(product => {
        return req.user.addToCart(product);
    }).then(() => {
        console.log('Product Added to Cart!')
        res.redirect('/products-list');
    }).catch(err => next(err))
}

const deleteShopCartItem = (req, res, next) => {
    const productId = req.params.productId;
    req.user.deleteItemFromCart(productId).then(() =>
        res.redirect('/cart')
    ).catch(err => next(err))
}

const getCheckout = (req, res, next) => {
    let cartProducts;
    let totalSum = 0;

    req.user.populate('cart.items.productId')
    .then(userData => {
        cartProducts = userData.cart.items.map(product => {
            return {product: {...product.productId._doc}, productQtd: product.productQtd}
        });
        cartProducts.forEach(p => totalSum += p.productQtd * p.product.pPrice);
        return stripe.checkout.sessions.create({ 
            payment_method_types: ["card"],
            mode: "payment",
            line_items: cartProducts.map((p) => { 
              return {
                quantity: p.productQtd,
                price_data: {
                  currency: "usd",
                  unit_amount: p.product.pPrice * 100,
                  product_data: {
                    name: p.product.pName,
                    description: p.product.pDescription,
                  },
                },
              };
            }),
            customer_email: req.user.uEmail,
 
            success_url: req.protocol + "://" + req.get("host") + "/checkout/success",
            // Checkout stripe documentation for prevent users to load the /checkout/success
            // url without paying.
            cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
        });
    }).then((session) => {
        res.render('shop/checkout', { docTitle: "Checkout",  path: '/checkout', products: cartProducts,
        totalSum: totalSum, sessionId: session.id })
    }).catch(err => next(err))
};

const postOrder = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .then(userData => {
        const productsOrder = userData.cart.items.map(product => {
            return {product: {...product.productId._doc}, productQtd: product.productQtd}
        })
        const newOrder = new Order({items: productsOrder, user: {userId: req.user._id, userName: req.user.uName, userEmail: req.user.uEmail}})
        return newOrder.save()
    }).then(() => {
        return req.user.clearUserCart();
    }).then(() => res.redirect('/orders'))
    .catch(err => next(err))
};

const getOrders = (req, res, next) => {
    Order.find({'user.userId': req.user._id}).then(orders => 
        res.render('shop/orders', {docTitle: "Orders", path: '/orders', orders: orders})
    ).catch(err => next(err))
};

const getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    
    Order.findById(orderId).then(order => {
        if(!order){
            return next(new Error('No order found'));
        }
        if(order.user.userId.toString() !== req.user._id.toString()){
            return next(new Error('You are not authorized to access this invoice.'));
        }

        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
        
        pdfDoc.fontSize(26).font('Times-Roman').text('Invoice', {align: 'center'});
        pdfDoc.text('-----------------------', {align: 'center'});
        let totalPrice = 0;
        order.items.forEach(prod => {
            totalPrice += prod.productQtd * prod.product.pPrice;
            pdfDoc.fontSize(14).text(`-> ${prod.product.pName} - ${prod.productQtd} X $ ${prod.product.pPrice}`, {align: 'left'});
        });
        pdfDoc.text('-----------------------------');
        pdfDoc.fontSize(16).fillColor('green').text('Total Price: $' + totalPrice);

        pdfDoc.end();
    });
}

module.exports = {getHomeIndex, getProducts, getProductDetail, getShopCart, postShopCart, deleteShopCartItem,
    getCheckout, postOrder, getOrders, getInvoice}