const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    items: [
        {
            product: {
                type: Object,
                required: true,
            },
            productQtd: {
                type: Number,
                required: true,
            },
        }
    ],
    user: {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User', 
            required: true
        },
        userName: {
            type: String,
            required: true
        },
        userEmail: {
            type: String,
            required: true
        }
    }
});

const orderModel = mongoose.model('Order', orderSchema);

module.exports = orderModel
