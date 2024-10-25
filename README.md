# Thalex MQP Simulator

A React-based Market Quality Program (MQP) simulator for Thalex BTC-PERPETUAL trading. This application allows users to simulate and analyze orderbook changes with custom bid and ask layers.

## Features

- Real-time orderbook data from Thalex API
- Custom bid and ask layer management
- TOBE score calculations
- Monthly rewards estimation
- Visual orderbook representation with Chart.js
- Additional market metrics (spread, depth, imbalance)

## Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd mqp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at http://localhost:3000

## Deployment to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy to Vercel:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

## Building for Production

To create a production build:
```bash
npm run build
```

The build files will be created in the `build` directory.

## Technologies Used

- React
- TypeScript
- Chart.js
- Bootstrap
- Vercel for deployment

## License

MIT
