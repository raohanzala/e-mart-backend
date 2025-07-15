# Guest Checkout API Documentation

## Overview
The guest checkout feature allows users to place orders without creating an account or logging in. This is useful for customers who want to make a quick purchase without the registration process.

## API Endpoints

### 1. Place Guest Order
**POST** `/api/orders/guest-place`

Place an order without authentication (guest checkout).

#### Request Body
```json
{
  "items": [
    {
      "_id": "product_id",
      "name": "Product Name",
      "quantity": 2,
      "newPrice": 1000,
      "profit": 200,
      "isAffiliate": true
    }
  ],
  "amount": 2000,
  "address": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "pincode": "10001"
  },
  "guestUser": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890"
  },
  "affiliateCode": "AFF123" // Optional
}
```

#### Response
```json
{
  "success": true,
  "message": "Guest Order Placed Successfully",
  "order": {
    "_id": "order_id",
    "orderNumber": "ORD123456",
    "isGuestOrder": true,
    "guestUser": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890"
    },
    "items": [...],
    "amount": 2000,
    "status": "Order Placed",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Find Guest Orders
**GET** `/api/orders/guest-orders?email=john@example.com&phone=1234567890`

Find guest orders by email or phone number.

#### Query Parameters
- `email` (optional): Email address to search for
- `phone` (optional): Phone number to search for

#### Response
```json
{
  "success": true,
  "orders": [
    {
      "_id": "order_id",
      "orderNumber": "ORD123456",
      "isGuestOrder": true,
      "guestUser": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890"
      },
      "items": [...],
      "amount": 2000,
      "status": "Order Placed",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalOrders": 1
}
```

## Validation Rules

### Guest User Data
- `name`: Required, non-empty string
- `email`: Required, valid email format
- `phone`: Required, valid phone number format

### Address Data
- `firstName`: Required
- `lastName`: Required
- `email`: Required
- `phone`: Required
- `address`: Required
- `city`: Required
- `state`: Required
- `pincode`: Required

### Order Data
- `items`: Required, non-empty array
- `amount`: Required, greater than 0

## Features

### 1. Affiliate Support
Guest orders support affiliate codes and commission tracking, just like regular orders.

### 2. Admin Integration
- Guest orders appear in the admin dashboard alongside regular orders
- Admin can search for guest orders by name, email, or phone
- Order status updates work for guest orders
- Notifications are sent for new guest orders

### 3. Order Tracking
- Guest orders can be tracked using the order number
- Orders can be found by email or phone number for customer service

## Error Responses

### Validation Errors
```json
{
  "success": false,
  "message": "Guest user information (name, email, phone) is required"
}
```

```json
{
  "success": false,
  "message": "Please provide a valid email address"
}
```

```json
{
  "success": false,
  "message": "Complete shipping address is required"
}
```

## Frontend Integration

### Example JavaScript
```javascript
// Place guest order
const placeGuestOrder = async (orderData) => {
  try {
    const response = await fetch('/api/orders/guest-place', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Order placed successfully:', result.order);
      // Redirect to order confirmation page
      window.location.href = `/order-confirmation/${result.order.orderNumber}`;
    } else {
      console.error('Order failed:', result.message);
    }
  } catch (error) {
    console.error('Error placing order:', error);
  }
};

// Find guest orders
const findGuestOrders = async (email, phone) => {
  try {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (phone) params.append('phone', phone);
    
    const response = await fetch(`/api/orders/guest-orders?${params}`);
    const result = await response.json();
    
    if (result.success) {
      console.log('Found orders:', result.orders);
    } else {
      console.error('Error finding orders:', result.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Security Considerations

1. **Rate Limiting**: Consider implementing rate limiting for guest orders to prevent abuse
2. **Email Verification**: You may want to send order confirmation emails to verify the email address
3. **Phone Verification**: Consider SMS verification for important orders
4. **Fraud Detection**: Implement fraud detection measures for guest orders

## Migration Notes

- Existing orders remain unchanged
- The `userId` field is now optional in the order model
- New fields added: `guestUser`, `isGuestOrder`
- Admin search functionality updated to include guest user fields 