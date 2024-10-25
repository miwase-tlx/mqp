import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface OrderbookChartProps {
  orderbook: Array<{
    price: number;
    quantity: number;
    isMidprice?: boolean;
  }>;
}

const OrderbookChart: React.FC<OrderbookChartProps> = ({ orderbook }) => {
  const currentMidPrice = orderbook.find(order => order.isMidprice)?.price || 0;
  const bids = orderbook.filter(order => !order.isMidprice && order.price < currentMidPrice);
  const asks = orderbook.filter(order => !order.isMidprice && order.price > currentMidPrice);

  const chartData = {
    labels: [...bids.map(b => b.price.toFixed(2)), ...asks.map(a => a.price.toFixed(2))],
    datasets: [
      {
        label: 'Bids',
        data: bids.map(b => b.quantity),
        backgroundColor: 'rgba(0, 255, 0, 0.5)',
        borderColor: 'rgba(0, 255, 0, 1)',
        borderWidth: 1
      },
      {
        label: 'Asks',
        data: [...new Array(bids.length).fill(0), ...asks.map(a => a.quantity)],
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
        borderColor: 'rgba(255, 0, 0, 1)',
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Price'
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Quantity'
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Orderbook Depth'
      }
    }
  };

  return (
    <div className="orderbook-chart">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default OrderbookChart;
