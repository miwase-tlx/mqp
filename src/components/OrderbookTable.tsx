import React from 'react';

interface Order {
  price: number;
  quantity: number;
  tobe: number;
  isMidprice?: boolean;
  isNew?: boolean;
}

interface OrderbookTableProps {
  orders: Order[];
  title: string;
  showTobeSum?: boolean;
  monthlyRewards?: number;
}

const OrderbookTable: React.FC<OrderbookTableProps> = ({ 
  orders, 
  title, 
  showTobeSum = false,
  monthlyRewards
}) => {
  const tobeSum = orders.reduce((sum, order) => 
    sum + (order.isMidprice ? 0 : order.tobe), 0
  );

  return (
    <div>
      <h2 className="mt-4">{title}</h2>
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Price</th>
              <th>Quantity</th>
              <th>TOBE</th>
              <th>TOBE%</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr 
                key={index} 
                className={`${order.isNew ? 'new-order' : ''} ${order.isMidprice ? 'midprice' : ''}`}
              >
                <td>
                  {order.isMidprice 
                    ? `Midprice ${order.price.toFixed(2)}` 
                    : order.price.toFixed(2)}
                </td>
                <td>{order.isMidprice ? '' : order.quantity.toFixed(3)}</td>
                <td>{order.isMidprice ? '' : order.tobe.toFixed(2)}</td>
                <td>
                  {order.isMidprice 
                    ? '' 
                    : `${(order.tobe * 100 / tobeSum).toFixed(2)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showTobeSum && (
        <div>
          TOBEsum: {tobeSum.toFixed(2)}
          {monthlyRewards !== undefined && 
            ` | Monthly Rewards: $${monthlyRewards.toFixed(2)}`}
        </div>
      )}
    </div>
  );
};

export default OrderbookTable;
