import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  // General Settings
  siteName: {
    type: String,
    required: true,
    default: "Realtime Wrist"
  },
  siteDescription: {
    type: String,
    default: "Your Premium Watch Destination"
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  websiteUrl: {
    type: String,
    required: true,
    default: "realtimewrist.com"
  },

  // Sale Timer Settings
  saleTimer: {
    isActive: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: "Exclusive Offer"
    },
    description: {
      type: String,
      default: "Limited time offer on selected watches"
    },
    endDate: {
      type: Date,
      default: null
    },
    discountPercentage: {
      type: Number,
      default: 0
    },
    backgroundColor: {
      type: String,
      default: ""
    }
  },

  // Social Media Links
  socialMedia: {
    facebook: String,
    instagram: String,
    youtube: String,
    whatsapp: String,
    linkedin: String,
  },

  // E-commerce Settings
  currency: {
    type: String,
    default: "INR"
  },
  currencySymbol: {
    type: String,
    default: "₹"
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  freeShippingThreshold: {
    type: Number,
    default: 5000
  },

  // SEO Settings
  seoSettings: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: String,
    googleAnalyticsId: String
  },

  // Maintenance Mode
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: "Site is under maintenance. Please check back later."
  },


  // Notification Settings
  notificationSettings: {
    orderConfirmation: {
      type: Boolean,
      default: true
    },
    orderStatusUpdate: {
      type: Boolean,
      default: true
    },
    newProductAlert: {
      type: Boolean,
      default: true
    },
    promotionalEmails: {
      type: Boolean,
      default: true
    }
  },

  termsConditions : {
    type : String,
    default : 'NNot policy'
  },

  // Return Policy
  returnPolicy: {
    returnPeriod: {
      type: Number,
      default: 7 // days
    },
    returnConditions: {
      type: String,
      default: "Items must be unused and in original packaging"
    }
  }
}, {
  timestamps: true
});

const settingsModel = mongoose.models.settings || mongoose.model('settings', settingsSchema);

export default settingsModel; 