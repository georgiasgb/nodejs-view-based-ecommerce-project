const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  pName: {
    type: String,
    required: true
  },
  pPrice: {
    type: Number,
    required: true
  },
  pDescription: {
    type: String,
    required: true
  },
  pImageUrl: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const productModel = mongoose.model('Product', productSchema);

module.exports = productModel
