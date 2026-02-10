const findOrderInSupply = (supplyDoc, orderId) => {
  return supplyDoc.orders.id(orderId);
};

const extractUserOrders = (supplies, userId) => {
  const userOrders = [];
  supplies.forEach(supply => {
    supply.orders.forEach(order => {
      if (order.user.toString() === userId) {
        userOrders.push({
          ...order.toObject(),
          supply: {
            _id: supply._id,
            title: supply.title,
            supplier: supply.supplier
          }
        });
      }
    });
  });
  return userOrders;
};

module.exports = {
  findOrderInSupply,
  extractUserOrders
};
