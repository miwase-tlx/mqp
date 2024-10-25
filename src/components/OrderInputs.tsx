import React from 'react';

interface Layer {
  size: number;
  spread: number;
}

interface OrderInputsProps {
  side: 'bid' | 'ask';
  layers: Layer[];
  onAddLayer: () => void;
  onRemoveLayer: (index: number) => void;
  onLayerChange: (index: number, field: 'size' | 'spread', value: number) => void;
}

const OrderInputs: React.FC<OrderInputsProps> = ({
  side,
  layers,
  onAddLayer,
  onRemoveLayer,
  onLayerChange,
}) => {
  return (
    <div>
      <h3>{side === 'bid' ? 'Bid' : 'Ask'} Orders</h3>
      <button 
        className="btn btn-primary mb-2" 
        onClick={onAddLayer}
      >
        Add {side === 'bid' ? 'Bid' : 'Ask'} Layer
      </button>
      <div>
        {layers.map((layer, index) => (
          <div key={index} className="mb-3">
            <div className="input-group mb-2">
              <span className="input-group-text">
                {side === 'bid' ? 'Bid' : 'Ask'} Size:
              </span>
              <input
                type="number"
                className="form-control"
                value={layer.size}
                step="0.1"
                min="0"
                onChange={(e) => onLayerChange(index, 'size', parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="input-group mb-2">
              <span className="input-group-text">Distance to Midprice (bps):</span>
              <input
                type="number"
                className="form-control"
                value={layer.spread}
                step="0.5"
                min="0.5"
                onChange={(e) => onLayerChange(index, 'spread', parseFloat(e.target.value))}
                required
              />
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onRemoveLayer(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderInputs;
