const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['cleaning_supplies', 'tools', 'materials', 'equipment'],
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  pricing: {
    retailPrice: {
      type: Number,
      required: true
    },
    wholesalePrice: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    minStock: {
      type: Number,
      default: 10
    },
    maxStock: Number,
    location: String
  },
  specifications: {
    weight: String,
    dimensions: String,
    material: String,
    color: String,
    warranty: String
  },
  images: [{
    url: String,
    publicId: String,
    thumbnail: String,
    alt: String
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isSubscriptionEligible: {
    type: Boolean,
    default: false
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const subscriptionKitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['cleaning', 'maintenance', 'monthly', 'quarterly', 'custom'],
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  pricing: {
    monthlyPrice: Number,
    quarterlyPrice: Number,
    yearlyPrice: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  frequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly'],
    default: 'monthly'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  targetAudience: [String], // e.g., ['cleaning_services', 'maintenance_teams']
  benefits: [String]
}, {
  timestamps: true
});

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  subscriptionKit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionKit'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'paypal', 'paymaya'],
      default: 'cash'
    },
    transactionId: String,
    paypalOrderId: String,
    paypalTransactionId: String,
    paymayaReferenceNumber: String,
    paymayaCheckoutId: String,
    paymayaPaymentId: String,
    paymayaInvoiceId: String,
    paymayaTransactionId: String,
    paidAt: Date
  },
  shipping: {
    method: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  isSubscription: {
    type: Boolean,
    default: false
  },
  subscriptionDetails: {
    frequency: String,
    nextDelivery: Date,
    isActive: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Indexes (sku already has unique index)
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ isActive: 1 });

subscriptionKitSchema.index({ category: 1 });
subscriptionKitSchema.index({ isActive: 1 });

orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = {
  Product: mongoose.model('Product', productSchema),
  SubscriptionKit: mongoose.model('SubscriptionKit', subscriptionKitSchema),
  Order: mongoose.model('Order', orderSchema)
};
