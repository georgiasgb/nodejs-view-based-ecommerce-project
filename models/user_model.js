const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    uName: {
        type: String,
        required: true,
    },
    uEmail: {
        type: String,
        required: true,
    },
    uPassword: {
        type: String,
        required: true,
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: "Product", 
                    required: true,
                },
                productQtd: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
});

userSchema.methods.addToCart = function (product) {
    let updatedProductItems = [];
    let prodQuantity = 1;
    
    const cartProductIndex = this.cart.items.findIndex(
        (prodCart) => prodCart.productId.toString() === product._id.toString()
    );
    updatedProductItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        prodQuantity += this.cart.items[cartProductIndex].productQtd;
        updatedProductItems[cartProductIndex].productQtd = prodQuantity;
    } else {
        updatedProductItems.push({
            productId: product._id,
            productQtd: prodQuantity,
        });
    }

    const updatedCart = {
        items: updatedProductItems,
    };

    this.cart = updatedCart;
    return this.save();
};

userSchema.methods.deleteItemFromCart = function (productId) {
    const updateCartItems = this.cart.items.filter(
        (item) => item.productId.toString() !== productId.toString()
    );
    this.cart.items = updateCartItems;
    return this.save();
};

userSchema.methods.clearUserCart = function () {
    this.cart.items = [];
    this.save()
}

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;