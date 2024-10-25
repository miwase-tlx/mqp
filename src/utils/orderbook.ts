export interface Order {
  price: number;
  quantity: number;
  tobe: number;
  isMidprice?: boolean;
  isNew?: boolean;
}

export interface Layer {
  size: number;
  spread: number;
}

export const calculatePriceScore = (pd: number, midPrice: number): number => {
  const typicalDistance = midPrice * 0.0001;
  const nd = pd / typicalDistance;
  return Math.pow(0.5, nd);
};

export const calculateTOBE = (pd: number, quantity: number, midPrice: number): number => {
  const priceScore = calculatePriceScore(pd, midPrice);
  return priceScore * quantity;
};

export const calculateMonthlyRewards = (tobe: number): number => {
  const minThreshold = 0.5;
  const maxThreshold = 3.0;
  const maxRewards = 30000;
  const minRewards = 0;

  if (tobe <= minThreshold) return minRewards;
  if (tobe >= maxThreshold) return maxRewards;

  const rewardRange = maxRewards - minRewards;
  const tobeRange = maxThreshold - minThreshold;
  const rewardPerTobe = rewardRange / tobeRange;

  return (tobe - minThreshold) * rewardPerTobe;
};

export const addOrder = (
  orderbook: Order[],
  price: number,
  size: number,
  side: 'bid' | 'ask'
): Order[] => {
  const newOrderbook = [...orderbook];
  const existingOrderIndex = newOrderbook.findIndex(order => order.price === price);

  if (existingOrderIndex !== -1) {
    newOrderbook[existingOrderIndex] = {
      ...newOrderbook[existingOrderIndex],
      quantity: newOrderbook[existingOrderIndex].quantity + size,
      isNew: true
    };
  } else {
    const insertIndex = newOrderbook.findIndex(order =>
      (side === 'bid' && order.price < price) || (side === 'ask' && order.price > price)
    );
    newOrderbook.splice(insertIndex, 0, {
      price,
      quantity: size,
      tobe: 0,
      isNew: true
    });
  }

  return newOrderbook;
};

export const updateOrderbookWithLayers = (
  originalOrderbook: Order[],
  bidLayers: Layer[],
  askLayers: Layer[]
): Order[] => {
  let newOrderbook = [...originalOrderbook];
  const originalMidPrice = originalOrderbook.find(order => order.isMidprice)?.price || 0;

  // Add bid layers
  bidLayers.forEach(layer => {
    const price = originalMidPrice * (1 - layer.spread / 10000);
    newOrderbook = addOrder(newOrderbook, price, layer.size, 'bid');
  });

  // Add ask layers
  askLayers.forEach(layer => {
    const price = originalMidPrice * (1 + layer.spread / 10000);
    newOrderbook = addOrder(newOrderbook, price, layer.size, 'ask');
  });

  // Sort orderbook by price descending
  newOrderbook.sort((a, b) => b.price - a.price);

  // Find new best bid and ask
  const newBestBid = newOrderbook.find(order => order.quantity > 0 && !order.isMidprice)?.price || 0;
  const newBestAsk = [...newOrderbook]
    .reverse()
    .find(order => order.quantity > 0 && !order.isMidprice)?.price || 0;

  // Update midPrice and recalculate TOBEs
  const newMidPrice = (newBestBid + newBestAsk) / 2;

  // Update or insert midprice order
  const midpriceIndex = newOrderbook.findIndex(order => order.isMidprice);
  if (midpriceIndex !== -1) {
    newOrderbook[midpriceIndex].price = newMidPrice;
  } else {
    const insertIndex = newOrderbook.findIndex(order => order.price < newMidPrice);
    newOrderbook.splice(insertIndex, 0, {
      price: newMidPrice,
      quantity: 0,
      tobe: 0,
      isMidprice: true
    });
  }

  // Recalculate TOBE for all orders
  return newOrderbook.map(order => {
    if (!order.isMidprice) {
      const pd = Math.abs(order.price - newMidPrice);
      return {
        ...order,
        tobe: calculateTOBE(pd, order.quantity, newMidPrice)
      };
    }
    return order;
  });
};
