import settingsModel from '../models/settings.model.js';

// Get all settings
const getSettings = async (req, res) => {
  try {
    let settings = await settingsModel.findOne();
    
    // If no settings exist, create default settings
    // if (!settings) {
    //   settings = await initializeDefaultSettings();
    // }

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