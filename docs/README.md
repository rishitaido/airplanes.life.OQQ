[![Contribute](https://img.shields.io/badge/Contribute-Here-blue)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/CoC-Important-red)](CODE_OF_CONDUCT.md)

#Airplanes.life — AI Travel Concierge

AI-powered travel assistant that generates personalized itineraries, interactive maps, and 3D visualizations — all served through a Flask-based web app with modern monitoring and logging.

## 🔥 Features

🤖 AI Chatbot — generate trip plans, get travel recommendations

🗺️ Itinerary Viewer — interactive generated itinerary

🏟️ Airport Maps — view maps of selected airports (Mapbox)

⚙️ Real-time Monitoring — Prometheus + Grafana dashboards

📜 Log Aggregation — Loki + Promtail for central logs

📱 Responsive Design — mobile-friendly

---

## 🛠 Tech Stack

Python (Flask, FastAPI, SQLAlchemy)

AI / ML: scikit-learn, pandas, matplotlib, spotipy

Frontend: vanilla JS, Mapbox GL, HTML/CSS

Monitoring: Prometheus, Grafana

Logging: Loki, Promtail

Docker Compose for orchestration

---

## 🚀 Getting Started

# Clone the repo
  git clone https://github.com/yourusername/airplanes.life.git
  
  cd airplanes.life

# Create virtual env
  python3 -m venv .venv
  
  source .venv/bin/activate

# Install dependencies
  pip install -r requirements.txt

# Set environment variables
cp .env.example .env
(edit with your keys)

# Run the app
python app.py

### 2. Run with Docker Compose
  docker-compose up --build

### 3. Environment Variables
  FLASK_ENV=development
  
  OPENAI_API_KEY=your-key-here
  
  MAPBOX_API_KEY=your-key-here
  
  GRAFANA_PASSWORD=your-password-here






 



