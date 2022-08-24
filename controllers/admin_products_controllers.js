const Product = require('../models/product_model');
const { validationResult } = require('express-validator');
const deleteFile = require('../helpers/file').deleteFile; 

const getProductsAdminList = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    const ITEMS_PER_PAGE = 3;

    Product.find({userId: req.user._id})
    .countDocuments()
    .then(totalProducts => {
        totalItems = totalProducts;
        return Product.find({userId: req.user._id})
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    }).then(products => {
        let message = req.flash('errorMsgAdmin');
        if (message.length <= 0){
            message = null;
        }
        res.render('admin/products-admin-list', {prods: products, docTitle:'Admin Products List', 
        path: 'admin/products-admin-list', errorMessage: message, hasPreviousPage: page > 1, 
        previousPage: page - 1, currentPage: page, hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        nextPage: page + 1, lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)});
    }).catch(err => next(err))
}

const getAddProduct = (req, res, next) => { 
    res.render('admin/edit-product', {editing: false, docTitle: 'Add Product', path: '/admin/add-product',
    product:{}, typeErrors: [], errorMessage: null});
}
  
const postAddProduct = (req, res, next) => {
    const pName = req.body.pName;
    const pPrice = req.body.pPrice;
    const pDescription = req.body.pDescription; 
    const pImage = req.file;
    const userId = req.user;

    const errors = validationResult(req);
    if(!errors.isEmpty() || !pImage) {
        let errorMessage = 'Please enter valid inputs.';
        if(!pImage){
            errorMessage = 'Attached file is not a image.';
            typeErrors.push('pImage');
        }
        const typeErrors = errors.array().map(e => e.param);
        return res.status(422).render('admin/edit-product', {editing: false, docTitle: 'Add Product', 
        path: '/admin/add-product', product:{pName: pName, pPrice: pPrice, pDescription: pDescription},
        typeErrors: typeErrors, errorMessage: errorMessage});
    }

    const pImageUrl = pImage.path;
    const newProduct = new Product({pName, pPrice, pDescription, pImageUrl, userId});
    newProduct.save() 
    .then(() => {
        console.log('Product created!');
        res.redirect('/admin/products');
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

const getEditProduct = (req, res, next) => {
    const productId = req.params.productId;
    const editing = req.query.editMode;
    if (!editing) {
        req.flash('errorMsgAdmin', 'You are not allowed to edit products.');
        return res.redirect('/admin/products-admin-list');
    }
    Product.findById(productId)
    .then((product)=> {
        if (!product) {
            req.flash('errorMsgAdmin', 'Product not found.');
            return res.redirect('/admin/products-admin-list');
        }
        if(product.userId.toString() !== req.user._id.toString()) {
            req.flash('errorMsgAdmin', 'You are not allowed to edit this product.');
            return res.redirect('/admin/products-admin-list');
        }
        res.render('admin/edit-product', {editing: editing, product: product, docTitle: 'Edit Product', 
        path: 'admin/edit-product', typeErrors: [], errorMessage: null})
    }).catch(err => next(err));
}

const postUpdateProduct = (req, res, next) => {
    const pName = req.body.pName;
    const pPrice = req.body.pPrice;
    const pDescription = req.body.pDescription;
    const pImage = req.file;
    const productId = req.params.productId;
    
    const errors = validationResult(req); 
    if(!errors.isEmpty()) {
        const typeErrors = errors.array().map(e => e.param);
        return res.status(422).render('admin/edit-product', {editing: true, docTitle: 'Edit Product', 
        path: 'admin/edit-product', product: {_id: productId, pName: pName, pPrice: pPrice, pDescription: pDescription},
        typeErrors: typeErrors, errorMessage: 'Please enter valid inputs.'});
    }

    Product.findById(productId).then(product => {
        if(product.userId.toString() !== req.user._id.toString()) {
            req.flash('errorMsgAdmin', 'You are not allowed to edit this product.');
            return res.redirect('/admin/products-admin-list');
        }
        product.pName = pName;
        product.pPrice = pPrice;
        product.pDescription = pDescription;
        if (pImage) {
            deleteFile(product.pImageUrl);
            product.pImageUrl = pImage.path;
        }
        product.save();
    }).then(() => {
        console.log('Product Uptaded!');
        res.redirect('/admin/products-admin-list')
    }).catch(err => next(err));
}
 
const deleteProduct = (req, res, next) => {
    const productId = req.params.productId;
    
    Product.findById(productId).then((product)=> {
        if(!product) { 
            return next(new Error('This product does not exist to be deleted.'))
        }
        if(product.userId.toString() !== req.user._id.toString()) {
            req.flash('errorMsgAdmin', 'You are not allowed to delete this product.');
            return res.redirect('/admin/products-admin-list');
        } 
        deleteFile(product.pImageUrl);
        return Product.findByIdAndDelete(productId);
    }).then(() => {
        console.log('Product Deleted!');
        res.status(200).json({message: 'Success!'}); 
    }).catch(err => {
        // next(err);
        res.status(500).json({message: 'Deleting product failed.'});
    });
}

module.exports = {getAddProduct, postAddProduct, getProductsAdminList, getEditProduct, postUpdateProduct, deleteProduct}