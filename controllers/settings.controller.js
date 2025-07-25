import settingsModel from '../models/settings.model.js';

const initializeDefaultSettings = async () => {
  const defaultSettings = {
    siteName: "Realtime Wrist",
    siteDescription: "Your Premium Watch Destination",
    contactEmail: "contact@realtimewrist.com",
    contactPhone: "+91 1234567890",
    address: "123 Watch Street, Mumbai, India",
    socialMedia: {
      facebook: "https://facebook.com/realtimewrist",
      instagram: "https://instagram.com/realtimewrist",
      youtube: "https://youtube.com/realtimewrist",
      whatsapp: "https://wa.me/919826000000",
      linkedin: "https://linkedin.com/company/realtimewrist"
    },
    termsConditions : 'Policy',
    currency: "INR",
    currencySymbol: "₹",
    taxRate: 18,
    shippingCost: 0,
    freeShippingThreshold: 5000,
    seoSettings: {
      metaTitle: "Realtime Wrist - Premium Watches Collection",
      metaDescription: "Discover our exclusive collection of premium watches at Realtime Wrist",
      metaKeywords: "watches, luxury watches, premium watches, wrist watches",
      googleAnalyticsId: "UA-XXXXXXXXX-X"
    },
    maintenanceMode: false,
    maintenanceMessage: "Site is under maintenance. Please check back later.",
    notificationSettings: {
      orderConfirmation: true,
      orderStatusUpdate: true,
      newProductAlert: true,
      promotionalEmails: true
    },
    returnPolicy: {
      returnPeriod: 7,
      returnConditions: "Items must be unused and in original packaging"
    },
    banners: [
      {
        title: "Summer Collection",
        image: "banner1.jpg",
        link: "/summer-collection",
        active: true,
        position: "top"
      }
    ],
    themeSettings: {
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      fontFamily: "Arial"
    }
  };

  return await settingsModel.create(defaultSettings);
};

// Get all settings
const getSettings = async (req, res) => {
  try {
    let settings = await settingsModel.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await initializeDefaultSettings();
    }

    // Only auto-disable sale timer if it's not explicitly set to true
    if (settings.saleTimer?.isActive && settings.saleTimer?.endDate) {
      const endDate = new Date(settings.saleTimer.endDate);
      const now = new Date();
      
      // Only auto-disable if the end date has passed and isActive wasn't explicitly set to true
      if (endDate < now && settings.saleTimer.isActive !== true) {
        settings.saleTimer.isActive = false;
        await settings.save();
      }
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

// Update settings
const updateSettings = async (req, res) => {
  try {
    const {details : updates} = req.body;
    console.log('Received updates:', JSON.stringify(updates, null, 2));
    
    // Find and update settings
    let settings = await settingsModel.findOne();
    console.log('Current settings:', JSON.stringify(settings, null, 2));
    
    if (!settings) {
      // If no settings exist, create new with updates
      settings = await settingsModel.create(updates);
    } else {
      // Update existing settings with nested objects
      for (const key in updates) {
        if (typeof updates[key] === 'object' && updates[key] !== null) {
          // Handle nested objects
          if (!settings[key]) {
            settings[key] = {};
          }
          
          // Special handling for saleTimer
          if (key === 'saleTimer') {
            console.log('Processing saleTimer update:', JSON.stringify(updates[key], null, 2));
            
            // Create a new saleTimer object with all updates
            const updatedSaleTimer = {
              ...settings[key],
              ...updates[key]
            };
            
            // Handle endDate if provided
            if (updates[key].endDate) {
              updatedSaleTimer.endDate = new Date(updates[key].endDate);
            }
            
            // Explicitly set isActive if provided in updates
            if (updates[key].isActive !== undefined) {
              updatedSaleTimer.isActive = updates[key].isActive;
            }
            
            console.log('Updated saleTimer:', JSON.stringify(updatedSaleTimer, null, 2));
            
            // Assign the updated saleTimer back to settings
            settings[key] = updatedSaleTimer;
          } else {
            // Handle other nested objects normally
            settings[key] = {
              ...settings[key],
              ...updates[key]
            };
          }
        } else {
          // Handle primitive values
          settings[key] = updates[key];
        }
      }
      
      console.log('Final settings before save:', JSON.stringify(settings, null, 2));
      await settings.save();
      console.log('Settings saved successfully');
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

export {
  getSettings,
  updateSettings,
}; 