import orderModel from "../models/order.model.js";
import { createNotification } from './notification.controller.js';

// Guest checkout function - no authentication required
const guestPlaceOrder = async (req, res) => {
  try {
    const { formData, cartItems, total } = req.body;

    // Validate guest user data
    if (!formData || !formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      return res.json({ 
        success: false, 
        message: "Complete information is required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return res.json({ 
        success: false, 
        message: "Please provide a valid email address" 
      });
    }

    // Validate address
    if (!formData.address || !formData.city || !formData.state || !formData.zipCode || !formData.country) {
      return res.json({ 
        success: false, 
        message: "Complete shipping address is required (address, city, state, zipCode, country)" 
      });
    }

    // Validate items
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.json({ 
        success: false, 
        message: "Order must contain at least one item" 
      });
    }

    // Validate amount
    if (!total || total <= 0) {
      return res.json({ 
        success: false, 
        message: "Order amount must be greater than 0" 
      });
    }

    const orderData = {
      guestUser: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: String(formData.phone).trim()
      },
      address: {
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim(),
        country: formData.country.trim()
      },
      items: cartItems.map(item => ({
        title: item.title,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        slug: item.slug
      })),
      amount: total
    };

    const newOrder = await orderModel.create(orderData);

    // Create notification for new order
    await createNotification('NEW_ORDER','New Guest Order Received', `New order received from ${formData.firstName} ${formData.lastName}`, {
      orderId: newOrder._id,
      orderAmount: total,
      orderItems: cartItems.map(item => ({
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        slug: item.slug
      }))
    });

    res.json({ 
      success: true, 
      message: "Guest Order Placed Successfully",
      order: newOrder
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const deletedOrder = await orderModel.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order deleted successfully", order: deletedOrder });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const userOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await orderModel.find({ userId }).sort({ createdAt: -1 }); // Sort by latest orders
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    console.log(orderId, status, "ORDER UPDATE");

    let updateFields = { status };

    if (status === "Delivered") {
      updateFields.completedAt = new Date();

      // Find the order to check if it's an affiliate order
      const order = await orderModel.findById(orderId);
      
      if (order && order.isAffiliateOrder && order.referralId) {
        // Update the referral status to completed
        await referralModel.findByIdAndUpdate(order.referralId, {
          status: 'completed',
          completedAt: new Date()
        });

        // Update affiliate earnings and balance
        if (order.affiliateId) {
          await affiliateModel.findByIdAndUpdate(order.affiliateId, {
            $inc: { 
              totalEarnings: order.commission,
              pendingBalance: order.commission // Also increment pendingBalance
            }
          });
        }
      }
    } else if (status === "Canceled" || status === "Refunded") {
      // If order is canceled or refunded, update referral status accordingly
      const order = await orderModel.findById(orderId);
      
      if (order && order.isAffiliateOrder && order.referralId) {
        await referralModel.findByIdAndUpdate(order.referralId, {
          status: 'cancelled'
        });
      }
    }

    await orderModel.findByIdAndUpdate(orderId, updateFields);

    res.json({ success: true, message: "Status updated successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


const paginationOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const searchQuery = req.query.search || ''; // Search query for orders
  const sortBy = req.query.sortField || 'createdAt'; // Sorting field (default: createdAt)
  const status = req.query.filterBy || ''; // Order status filter

  if (page <= 0 || pageSize <= 0) {
    return res
      .status(400)
      .json({ error: 'Page and pageSize must be positive numbers' });
  }

  let sortCriteria = {};
  switch (sortBy) {
    case 'oldest':
      sortCriteria = { createdAt: 1 };
      break;
    case 'newest':
      sortCriteria = { createdAt: -1 };
      break;
    case 'amount-high-to-low':
      sortCriteria = { amount: -1 };
      break;
    case 'amount-low-to-high':
      sortCriteria = { amount: 1 };
      break;
    default:
      sortCriteria = { createdAt: -1 }; // Default sorting by newest orders
      break;
  }

  try {
    const aggregationPipeline = [];

    // Search functionality
    if (searchQuery) {
      aggregationPipeline.push({
        $match: {
          $or: [
            { 'address.firstName': { $regex: searchQuery, $options: 'i' } },
            { 'address.lastName': { $regex: searchQuery, $options: 'i' } },
            { 'address.email': { $regex: searchQuery, $options: 'i' } },
            { 'address.phone': { $regex: searchQuery, $options: 'i' } },
            // Add search for guest user fields
            { 'guestUser.name': { $regex: searchQuery, $options: 'i' } },
            { 'guestUser.email': { $regex: searchQuery, $options: 'i' } },
            { 'guestUser.phone': { $regex: searchQuery, $options: 'i' } },
          ],
        },
      });

      // If searchQuery looks like an ObjectId, include userId search
      if (/^[0-9a-fA-F]{24}$/.test(searchQuery)) {
        aggregationPipeline.push({
          $match: { userId: searchQuery },
        });
      }
    }

    // Add status filter if provided
    if (status) {
      aggregationPipeline.push({ $match: { status } });
    }

    // Add sorting criteria
    aggregationPipeline.push({ $sort: sortCriteria });

    // Add pagination stages
    aggregationPipeline.push(
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize }
    );

    console.log('Aggregation Pipeline:', JSON.stringify(aggregationPipeline, null, 2));

    // **Count total orders without pagination**
    const totalOrdersPipeline = [{ $match: {} }];

    if (searchQuery) {
      totalOrdersPipeline.push({
        $match: {
          $or: [
            { 'address.firstName': { $regex: searchQuery, $options: 'i' } },
            { 'address.lastName': { $regex: searchQuery, $options: 'i' } },
            { 'address.email': { $regex: searchQuery, $options: 'i' } },
            { 'address.phone': { $regex: searchQuery, $options: 'i' } },
            // Add search for guest user fields
            { 'guestUser.name': { $regex: searchQuery, $options: 'i' } },
            { 'guestUser.email': { $regex: searchQuery, $options: 'i' } },
            { 'guestUser.phone': { $regex: searchQuery, $options: 'i' } },
          ],
        },
      });

      if (/^[0-9a-fA-F]{24}$/.test(searchQuery)) {
        totalOrdersPipeline.push({
          $match: { userId: searchQuery },
        });
      }
    }

    if (status) {
      totalOrdersPipeline.push({ $match: { status } });
    }

    totalOrdersPipeline.push({ $count: 'totalOrders' });

    const [orders, totalOrdersResult] = await Promise.all([
      orderModel.aggregate(aggregationPipeline),
      orderModel.aggregate(totalOrdersPipeline),
    ]);

    const totalOrders = totalOrdersResult.length
      ? totalOrdersResult[0].totalOrders
      : 0;

    res.json({
      currentPage: page,
      pageSize: pageSize,
      totalOrders: totalOrders,
      totalPages: Math.ceil(totalOrders / pageSize),
      orders: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const ordersDetails = async (req, res) => {
  try {

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const endOfYesterday = new Date(startOfToday.getTime() - 1);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const totalOrders = await orderModel.countDocuments();

    const totalRevenueResult = await orderModel.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);

    const totalRevenue =
      totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;
    const averageOrderValue = totalRevenue / totalOrders;
    // // const conversionRate = (totalOrders / totalVisitors) * 100;
    const topProducts = await orderModel.aggregate([
      { $unwind: "$items" },
      {
        $group: { _id: "$items.name", totalSales: { $sum: "$items.quantity" } },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]);

    const pendingOrders = await orderModel.countDocuments({
      status: "Pending",
    });
    const completedOrders = await orderModel.countDocuments({
      status: "Delivered",
    });
    const canceledOrders = await orderModel.countDocuments({
      status: "Canceled",
    });

    const dailyOrders = await orderModel.aggregate([
      {
        $project: {
          day: { $dayOfYear: "$createdAt" }, // Use createdAt instead of items.date
          year: { $year: "$createdAt" }, // Use createdAt instead of items.date
          amount: "$amount", // Use the amount field directly
        },
      },
      {
        $group: {
          _id: { day: "$day", year: "$year" },
          totalOrders: { $sum: 1 }, // Count of orders per day
          totalRevenue: { $sum: "$amount" }, // Sum of order amounts per day
        },
      },
      {
        $sort: { "_id.year": -1, "_id.day": -1 },
      },
    ]);


    const repeatCustomers = await orderModel.aggregate([
      {
        $group: {
          _id: "$customerId",
          orderCount: { $sum: 1 },
        },
      },
      {
        $match: {
          orderCount: { $gt: 1 },
        },
      },
      {
        $project: {
          customerId: "$_id",
          orderCount: 1,
          _id: 0,
        },
      },
      {
        $group: {
          _id: null,
          totalRepeatCustomers: { $sum: 1 },
          customers: { $push: "$customerId" },
        },
      },
      {
        $project: {
          _id: 0,
          totalRepeatCustomers: 1,
          customers: 1,
        },
      },
    ]);

    const averageCompletionTime = await orderModel.aggregate([
      {
        $match: {
          completedAt: { $exists: true, $ne: null },
          createdAt: { $exists: true, $ne: null },
        },
      },
      {
        $project: { timeTaken: { $subtract: ["$completedAt", "$createdAt"] } },
      },
      {
        $group: { _id: null, avgTime: { $avg: "$timeTaken" } },
      },
    ]);

    const [todayOrdersValue, yesterdayOrdersValue, thisMonthOrdersValue, lastMonthOrdersValue] =
      await Promise.all([
        // Today's orders value
        orderModel.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfToday, $lte: endOfToday },
            },
          },
          {
            $group: {
              _id: null,
              totalValue: { $sum: "$amount" },
            },
          },
        ]),
        // Yesterday's orders value
        orderModel.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
            },
          },
          {
            $group: {
              _id: null,
              totalValue: { $sum: "$amount" },
            },
          },
        ]),
        // This month's orders value
        orderModel.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfThisMonth, $lte: now },
            },
          },
          {
            $group: {
              _id: null,
              totalValue: { $sum: "$amount" },
            },
          },
        ]),
        // Last month's orders value
        orderModel.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
            },
          },
          {
            $group: {
              _id: null,
              totalValue: { $sum: "$amount" },
            },
          },
        ]),
      ]);

    res.json({
      totalOrders,
      totalRevenue,
      totalRevenueAmount: totalRevenue,
      completedOrders,
      averageOrderValue,
      pendingOrders,
      canceledOrders,
      topProducts,
      dailyOrders,
      repeatCustomers,
      averageCompletionTime,
      todayOrdersValue: todayOrdersValue.length > 0 ? todayOrdersValue[0].totalValue : 0,
      yesterdayOrdersValue: yesterdayOrdersValue.length > 0 ? yesterdayOrdersValue[0].totalValue : 0,
      thisMonthOrdersValue: thisMonthOrdersValue.length > 0 ? thisMonthOrdersValue[0].totalValue : 0,
      lastMonthOrdersValue: lastMonthOrdersValue.length > 0 ? lastMonthOrdersValue[0].totalValue : 0,
      allTimeSalesValue: totalRevenue,
      // userGrowth,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const singleOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, order });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Function to find guest orders by email or phone
const findGuestOrders = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await orderModel.findOne({ _id: orderId });

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  deleteOrder,
  allOrders,
  userOrders,
  updateStatus,
  paginationOrders,
  singleOrder,
  ordersDetails,
  guestPlaceOrder,
  findGuestOrders
};
