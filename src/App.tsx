import React, { useState, useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import OrderbookChart from './components/OrderbookChart';
import OrderbookTable from './components/OrderbookTable';
import OrderInputs from './components/OrderInputs';
import { Order, Layer, calculateMonthlyRewards, updateOrderbookWithLayers } from './utils/orderbook';

function App() {
  const [initialOrderbook, setInitialOrderbook] = useState<Order[]>([]);
  const [updatedOrderbook, setUpdatedOrderbook] = useState<Order[]>([]);
  const [bidLayers, setBidLayers] = useState<Layer[]>([]);
  const [askLayers, setAskLayers] = useState<Layer[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setMockData = useCallback(() => {
    const mockOrderbook = [
      { price: 50000, quantity: 1, tobe: 0 },
      { price: 49900, quantity: 2, tobe: 0 },
      { price: 49800, quantity: 3, tobe: 0 },
      { price: 49700, quantity: 4, tobe: 0 },
      { price: 49600, quantity: 5, tobe: 0 },
      { price: 49550, quantity: 0, tobe: 0, isMidprice: true },
      { price: 49500, quantity: 1, tobe: 0 },
      { price: 49400, quantity: 2, tobe: 0 },
      { price: 49300, quantity: 3, tobe: 0 },
      { price: 49200, quantity: 4, tobe: 0 },
      { price: 49100, quantity: 5, tobe: 0 }
    ];
    setInitialOrderbook(mockOrderbook);
    setUpdatedOrderbook(mockOrderbook);
    setLastUpdateTime(new Date().toLocaleTimeString());
  }, []);

  const fetchThalexOrderbook = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous fetches
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const thalexApiUrl = 'https://thalex.com/api/v2/public/book?instrument_name=BTC-PERPETUAL';
      const response = await fetch(corsProxy + encodeURIComponent(thalexApiUrl));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.result) {
        throw new Error('No result in API response');
      }

      const bids = data.result.bids.slice(0, 5);
      const asks = data.result.asks.slice(0, 5);
      const midPrice = (parseFloat(bids[0][0]) + parseFloat(asks[0][0])) / 2;

      const newOrderbook = [
        ...bids.map(([price, quantity]: [string, number]) => ({
          price: parseFloat(price),
          quantity,
          tobe: 0
        })),
        { price: midPrice, quantity: 0, tobe: 0, isMidprice: true },
        ...asks.map(([price, quantity]: [string, number]) => ({
          price: parseFloat(price),
          quantity,
          tobe: 0
        }))
      ].sort((a, b) => b.price - a.price);

      setInitialOrderbook(newOrderbook);
      
      // Update the orderbook while preserving user's layers
      const updatedBook = updateOrderbookWithLayers(newOrderbook, bidLayers, askLayers);
      setUpdatedOrderbook(updatedBook);
      
      setLastUpdateTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching Thalex orderbook:', error);
      setErrorMessage('Failed to fetch orderbook data');
      
      if (initialOrderbook.length === 0) {
        console.log('Using mock data as fallback');
        setMockData();
      }
    } finally {
      setIsLoading(false);
    }
  }, [setMockData, bidLayers, askLayers, initialOrderbook.length, isLoading]);

  useEffect(() => {
    fetchThalexOrderbook();
    loadSavedInputs();

    // Set up automatic refresh every 5 seconds
    const refreshInterval = setInterval(fetchThalexOrderbook, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [fetchThalexOrderbook]);

  const handleAddBidLayer = () => {
    setBidLayers([...bidLayers, { size: 0.4, spread: 1 }]);
    saveInputsToLocalStorage([...bidLayers, { size: 0.4, spread: 1 }], askLayers);
  };

  const handleAddAskLayer = () => {
    setAskLayers([...askLayers, { size: 0.4, spread: 1 }]);
    saveInputsToLocalStorage(bidLayers, [...askLayers, { size: 0.4, spread: 1 }]);
  };

  const handleRemoveBidLayer = (index: number) => {
    const newLayers = bidLayers.filter((_, i) => i !== index);
    setBidLayers(newLayers);
    saveInputsToLocalStorage(newLayers, askLayers);
  };

  const handleRemoveAskLayer = (index: number) => {
    const newLayers = askLayers.filter((_, i) => i !== index);
    setAskLayers(newLayers);
    saveInputsToLocalStorage(bidLayers, newLayers);
  };

  const handleBidLayerChange = (index: number, field: 'size' | 'spread', value: number) => {
    const newLayers = bidLayers.map((layer, i) =>
      i === index ? { ...layer, [field]: value } : layer
    );
    setBidLayers(newLayers);
    saveInputsToLocalStorage(newLayers, askLayers);
  };

  const handleAskLayerChange = (index: number, field: 'size' | 'spread', value: number) => {
    const newLayers = askLayers.map((layer, i) =>
      i === index ? { ...layer, [field]: value } : layer
    );
    setAskLayers(newLayers);
    saveInputsToLocalStorage(bidLayers, newLayers);
  };

  const handleConfirm = () => {
    const newOrderbook = updateOrderbookWithLayers(initialOrderbook, bidLayers, askLayers);
    setUpdatedOrderbook(newOrderbook);
  };

  const saveInputsToLocalStorage = (bids: Layer[], asks: Layer[]) => {
    localStorage.setItem('mqpSimulationInputs', JSON.stringify({ bidLayers: bids, askLayers: asks }));
  };

  const loadSavedInputs = () => {
    const savedInputs = localStorage.getItem('mqpSimulationInputs');
    if (savedInputs) {
      const { bidLayers: savedBids, askLayers: savedAsks } = JSON.parse(savedInputs);
      setBidLayers(savedBids);
      setAskLayers(savedAsks);
    }
  };

  const calculateMetrics = () => {
    if (!updatedOrderbook.length) return null;

    const midPrice = updatedOrderbook.find(order => order.isMidprice)?.price || 0;
    const bids = updatedOrderbook.filter(order => !order.isMidprice && order.price < midPrice);
    const asks = updatedOrderbook.filter(order => !order.isMidprice && order.price > midPrice);

    const bestBid = Math.max(...bids.map(b => b.price));
    const bestAsk = Math.min(...asks.map(a => a.price));
    const spread = bestAsk - bestBid;
    const spreadBps = (spread / midPrice) * 10000;

    const bidDepth = bids.reduce((sum, bid) => sum + bid.quantity, 0);
    const askDepth = asks.reduce((sum, ask) => sum + ask.quantity, 0);
    const imbalance = (bidDepth - askDepth) / (bidDepth + askDepth);

    return { spread, spreadBps, bidDepth, askDepth, imbalance };
  };

  const metrics = calculateMetrics();

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Thalex MQP Simulation for BTC-PERPETUAL</h1>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <OrderInputs
            side="bid"
            layers={bidLayers}
            onAddLayer={handleAddBidLayer}
            onRemoveLayer={handleRemoveBidLayer}
            onLayerChange={handleBidLayerChange}
          />
        </div>
        <div className="col-md-6">
          <OrderInputs
            side="ask"
            layers={askLayers}
            onAddLayer={handleAddAskLayer}
            onRemoveLayer={handleRemoveAskLayer}
            onLayerChange={handleAskLayerChange}
          />
        </div>
      </div>

      <button className="btn btn-success me-2" onClick={handleConfirm}>
        Confirm
      </button>
      <button 
        className={`btn btn-secondary ${isLoading ? 'disabled' : ''}`} 
        onClick={fetchThalexOrderbook}
        disabled={isLoading}
      >
        {isLoading ? 'Refreshing...' : 'Refresh Orderbook'}
      </button>
      <small className="ms-2 text-muted">Last updated: {lastUpdateTime}</small>
      {errorMessage && <div className="alert alert-danger mt-2">{errorMessage}</div>}

      <OrderbookTable
        orders={initialOrderbook}
        title="Thalex BTC-PERPETUAL Orderbook"
        showTobeSum
        monthlyRewards={calculateMonthlyRewards(
          initialOrderbook.reduce((sum, order) => sum + (order.isMidprice ? 0 : order.tobe), 0)
        )}
      />

      <OrderbookTable
        orders={updatedOrderbook}
        title="Updated orderbook with additional quotes"
        showTobeSum
        monthlyRewards={calculateMonthlyRewards(
          updatedOrderbook.reduce((sum, order) => sum + (order.isMidprice ? 0 : order.tobe), 0)
        )}
      />

      {metrics && (
        <div className="mt-4 p-3 bg-light">
          <h3>Additional Metrics</h3>
          <p>Spread: {metrics.spread.toFixed(2)} ({metrics.spreadBps.toFixed(2)} bps)</p>
          <p>Bid Depth: {metrics.bidDepth.toFixed(3)}</p>
          <p>Ask Depth: {metrics.askDepth.toFixed(3)}</p>
          <p>Order Book Imbalance: {(metrics.imbalance * 100).toFixed(2)}%</p>
        </div>
      )}

      <div className="orderbook-chart">
        <OrderbookChart orderbook={updatedOrderbook} />
      </div>
    </div>
  );
}

export default App;
