const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
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
  location: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
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
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  isSubscriptionEligible: {
    type: Boolean,
    default: false
  },
  orders: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    totalCost: {
      type: Number,
      required: true
    },
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    specialInstructions: String,
    contactInfo: {
      phone: String,
      email: String
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ isActive: 1 });
// Note: sku already has unique: true which creates an index
productSchema.index({ brand: 1, category: 1 });
productSchema.index({ 'pricing.retailPrice': 1, category: 1 });
productSchema.index({ 'inventory.quantity': 1, isActive: 1 });
productSchema.index({ createdAt: -1, isActive: 1 });
productSchema.index({ updatedAt: -1, isActive: 1 });

// Additional performance indexes
productSchema.index({ category: 1, subcategory: 1, isActive: 1 }); // Category filtering with status
productSchema.index({ supplier: 1, isActive: 1, category: 1 }); // Supplier products by category
productSchema.index({ 'pricing.retailPrice': 1, 'pricing.wholesalePrice': 1, isActive: 1 }); // Price range filtering
productSchema.index({ 'inventory.quantity': 1, 'inventory.minStock': 1, isActive: 1 }); // Stock level filtering
productSchema.index({ 'inventory.location': 1, isActive: 1 }); // Location-based filtering
productSchema.index({ 'specifications.brand': 1, 'specifications.model': 1, isActive: 1 }); // Brand/model filtering
productSchema.index({ 'specifications.material': 1, category: 1, isActive: 1 }); // Material filtering
productSchema.index({ 'specifications.color': 1, category: 1, isActive: 1 }); // Color filtering
productSchema.index({ isSubscriptionEligible: 1, isActive: 1 }); // Subscription eligibility
productSchema.index({ tags: 1, isActive: 1 }); // Tags filtering

// Text search index for products
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text'
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

// Note: sku already has unique: true which creates an index
// Note: category/subcategory, supplier, and isActive indexes are defined above

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
