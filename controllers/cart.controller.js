

const addToCart = async (req, res) => {
  // try {
  //   const userId = req.userId;
  //   const { productId, name, newPrice, image, quantity = 1, isAffiliate, profit } = req.body;

  //   console.log(productId, name, newPrice, image, quantity, isAffiliate, profit, "req.body");

  //   // Validate required fields
  //   if (!productId || !name || !newPrice || !image) {
  //     return res.json({ 
  //       success: false, 
  //       message: "Missing required product information" 
  //     });
  //   }

  //   const userData = await userModel.findById(userId);
  //   if (!userData) {
  //     return res.json({ 
  //       success: false, 
  //       message: "User not found" 
  //     });
  //   }

  //   // Initialize cartData if it doesn't exist
  //   if (!userData.cartData) {
  //     userData.cartData = [];
  //   }

  //   // Check if product already exists in cart
  //   const existingItemIndex = userData.cartData.findIndex(
  //     cartItem => cartItem.productId === productId
  //   );

  //   const productItem = {
  //     productId,
  //     name,
  //     newPrice,
  //     image,
  //     quantity,
  //     isAffiliate: isAffiliate || false,
  //     profit: profit || 0,
  //     addedAt: new Date()
  //   };

  //   if (existingItemIndex >= 0) {
  //     // Update quantity if product exists
  //     userData.cartData[existingItemIndex].quantity += quantity;
  //   } else {
  //     // Add new product to cart
  //     userData.cartData.push(productItem);
  //   }

  //   // Save the updated user document
  //   await userData.save();

  //   res.json({ 
  //     success: true, 
  //     message: "Added to cart", 
  //     cartItem: productItem,
  //     cartData: userData.cartData
  //   });
  // } catch (error) {
  //   console.error("Error in addToCart:", error);
  //   res.json({ 
  //     success: false, 
  //     message: error.message 
  //   });
  // }
};


const mergeCart = async (req, res) => {
  // try {
  //   const userId = req.userId; // Authenticated user's ID
  //   const { guestCart } = req.body; // Guest cart data from frontend

  //   console.log('Guest Cart:', guestCart);

  //   // Fetch the authenticated user's cart
  //   const user = await userModel.findById(userId);
  //   if (!user) {
  //     return res.json({ 
  //       success: false, 
  //       message: "User not found" 
  //     });
  //   }

  //   // Initialize user's cart if it doesn't exist
  //   if (!user.cartData) {
  //     user.cartData = [];
  //   }

  //   // Convert guest cart array to a map for easier lookup
  //   const guestCartMap = new Map(
  //     guestCart.map(item => [item.productId, item])
  //   );

  //   // Merge guest cart items into user's cart
  //   for (const guestItem of guestCart) {
  //     const existingItemIndex = user.cartData.findIndex(
  //       item => item.productId === guestItem.productId
  //     );

  //     if (existingItemIndex >= 0) {
  //       // If item exists, update quantity
  //       user.cartData[existingItemIndex].quantity += guestItem.quantity;
  //     } else {
  //       // If item doesn't exist, add it to cart
  //       user.cartData.push({
  //         productId: guestItem.productId,
  //         name: guestItem.name,
  //         newPrice: guestItem.newPrice,
  //         image: guestItem.image,
  //         quantity: guestItem.quantity,
  //         isAffiliate: guestItem.isAffiliate || false,
  //         profit: guestItem.profit || 0,
  //         addedAt: new Date()
  //       });
  //     }
  //   }

  //   // Save the updated cart
  //   await user.save();

  //   res.json({ 
  //     success: true, 
  //     message: "Cart merged successfully", 
  //     cartData: user.cartData 
  //   });
  // } catch (error) {
  //   console.error("Error merging cart:", error);
  //   res.json({ 
  //     success: false, 
  //     message: error.message 
  //   });
  // }
};


const updateCart = async (req, res) => {
  // try {
  //   const userId = req.userId;
  //   const { productId, quantity } = req.body;
  //   console.log(productId, quantity, "productId and quantity");

  //   // Fetch user data
  //   const userData = await userModel.findById(userId);
  //   let cartData = userData.cartData;

  //   // Find the cart item by itemId
  //   const itemIndex = cartData.findIndex(item => {
  //     return item.productId === productId // Ensure both sides are strings
  //   });

  //   if (itemIndex !== -1) {
  //     // Item found in cart, update its quantity
  //     cartData[itemIndex].quantity = quantity;

  //     // Update the user data in the database
  //     await userModel.findByIdAndUpdate(userId, { cartData });

  //     res.json({ success: true, message: 'Cart Updated', cartData });
  //   } else {
  //     // Item not found in the cart
  //     res.status(404).json({ success: false, message: 'Item not found in cart' });
  //   }
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ success: false, message: 'Server Error' });
  // }
};

const removeFromCart = async (req, res) => {
  // try {
  //   const userId = req.userId; // User ID from the authenticated request
  //   const { productId } = req.body; // Item ID to remove from the cart

  //   console.log(productId, "productId");

  //   // Fetch user data
  //   const userData = await userModel.findById(userId);
  //   let cartData = userData.cartData;

  //   // Find the cart item by itemId
  //   const itemIndex = cartData.findIndex(item => item.productId === productId);

  //   if (itemIndex !== -1) {
  //     // Remove the item from cartData
  //     cartData.splice(itemIndex, 1);

  //     // Update the user data in the database
  //     await userModel.findByIdAndUpdate(userId, { cartData });

  //     res.json({ success: true, message: 'Item removed from cart', cartData });
  //   } else {
  //     // Item not found in the cart
  //     res.status(404).json({ success: false, message: 'Item not found in cart' });
  //   }
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ success: false, message: 'Server Error' });
  // }
};


const getUserCart = async (req, res) => {
  // try {
  //   const userId = req.userId;

  //   const userData = await userModel.findById(userId);
  //   if (!userData) {
  //     return res.json({ success: false, message: "User not found" });
  //   }

  //   // Ensure cartData is an array and filter out any invalid entries
  //   let cartData = Array.isArray(userData.cartData) ? userData.cartData : [];
    
  //   // Filter out any entries that only contain _id
  //   cartData = cartData.filter(item => Object.keys(item).length > 1);

  //   // If cartData is empty or only contains invalid entries, update the user's cartData
  //   if (cartData.length === 0) {
  //     await userModel.findByIdAndUpdate(userId, { cartData: [] });
  //   }

  //   res.json({ success: true, cartData });
  // } catch (error) {
  //   console.log(error);
  //   res.json({ success: false, message: error.message });
  // }
}



export { addToCart, updateCart, getUserCart, mergeCart, removeFromCart }