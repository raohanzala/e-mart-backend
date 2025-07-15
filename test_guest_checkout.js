// Test script for guest checkout functionality
// Run this with: node test_guest_checkout.js

const testGuestCheckout = async () => {
  const baseURL = 'http://localhost:5000/api'; // Adjust port as needed
  
  // Test data for guest order
  const guestOrderData = {
    items: [
      {
        _id: "507f1f77bcf86cd799439011", // Sample product ID
        name: "Test Product",
        quantity: 2,
        newPrice: 1000,
        profit: 200,
        isAffiliate: false
      }
    ],
    amount: 2000,
    address: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "1234567890",
      address: "123 Test Street",
      city: "Test City",
      state: "Test State",
      pincode: "12345"
    },
    guestUser: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "1234567890"
    }
  };

  try {
    console.log('🧪 Testing Guest Checkout API...\n');

    // Test 1: Place guest order
    console.log('1. Testing guest order placement...');
    const orderResponse = await fetch(`${baseURL}/orders/guest-place`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(guestOrderData)
    });

    const orderResult = await orderResponse.json();
    
    if (orderResult.success) {
      console.log('✅ Guest order placed successfully!');
      console.log(`   Order ID: ${orderResult.order._id}`);
      console.log(`   Order Number: ${orderResult.order.orderNumber}`);
      console.log(`   Is Guest Order: ${orderResult.order.isGuestOrder}`);
      console.log(`   Guest Name: ${orderResult.order.guestUser.name}`);
      console.log(`   Guest Email: ${orderResult.order.guestUser.email}`);
    } else {
      console.log('❌ Guest order failed:', orderResult.message);
      return;
    }

    // Test 2: Find guest orders by email
    console.log('\n2. Testing guest order search by email...');
    const searchResponse = await fetch(`${baseURL}/orders/guest-orders?email=${guestOrderData.guestUser.email}`);
    const searchResult = await searchResponse.json();

    if (searchResult.success) {
      console.log('✅ Guest order search successful!');
      console.log(`   Found ${searchResult.totalOrders} orders`);
      if (searchResult.orders.length > 0) {
        console.log(`   Latest order: ${searchResult.orders[0].orderNumber}`);
      }
    } else {
      console.log('❌ Guest order search failed:', searchResult.message);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure your server is running on the correct port');
    console.log('💡 Update the baseURL in this script if needed');
  }
};

// Run the test
testGuestCheckout(); 