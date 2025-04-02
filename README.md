# Gemicast: Predictive Power Outage Platform

Gemicast is a predictive dashboard that combines real-time weather data, historical outage patterns, and infrastructure information to forecast power disruptions before they occur, enabling proactive measures.

## Features

- **Real-time Weather Monitoring**: Integrates with weather APIs to provide current conditions and forecasts
- **Predictive Analytics**: Uses machine learning models to predict power outages based on weather and infrastructure data
- **Interactive Map View**: Color-coded visualization of risk zones and current outages
- **Alert System**: Three-tiered notification system (warning, watch, advisory)
- **Power Status Tracking**: Real-time outage tracking with estimated restoration times
- **Community Reporting**: Crowdsourced incident reporting for faster response

## Technology Stack

- **Frontend**: Angular 19
- **Backend**: Google Cloud Functions, Firebase for real-time updates
- **Data Processing**: TensorFlow for predictive modeling, BigQuery for data storage
- **APIs**: Google Maps Platform, Weather data (OpenWeatherMap/NOAA)
- **ML Components**: Google Gemini API for natural language alerts, TensorFlow for prediction models
- **DevOps**: Google Cloud Build, Container Registry
- **Monitoring**: Google Cloud Monitoring, Firebase Analytics

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- Angular CLI 19.x
- Firebase CLI (for deployment)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-org/Gemicast.git
   cd Gemicast
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

### Running the Application

Start the development server:

```bash
npm start
```

The application will be available at http://localhost:4200/

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Development

### Code Scaffolding

Run `ng generate component component-name` to generate a new component.

You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Running Tests

To run the unit tests:

```bash
npm test
```

For end-to-end tests:

```bash
npm run e2e
```

## Deployment

This project is configured for deployment to Google Cloud Platform with Firebase Hosting.

1. Build the project for production:

   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## Project Structure

```
project-root/
├─ .github/workflows/         # GitHub workflows
├─ public/                    # Static assets
│  └─ images/                 # Image assets
├─ src/
│  ├─ app/
│  │  ├─ core/                # Core module
│  │  │  └─ components/       # Header, sidenav, etc.
│  │  ├─ features/            # Feature modules
│  │  ├─ shared/              # Shared components
│  │  └─ services/            # Application services
│  └─ assets/                 # Other assets
```

## Machine Learning Integration

The Gemicast platform leverages several ML models to provide accurate outage predictions:

- **TensorFlow / TensorFlow.js**: For in-browser prediction capabilities
- **Google Gemini API**: Used for natural language alert generation and insights
- **Keras**: Implements time-series forecasting of outage probability

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
