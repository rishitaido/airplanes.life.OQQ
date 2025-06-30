# OpenQQuantify

OpenQQuantify is a Python-based application designed for quantitative analysis and data-driven insights. Built with Flask, it provides a robust, reproducible environment for local development and deployment.

## Features

- Modern Python 3.11 application structure
- Flask web server (default port 5000)
- Dockerized for easy setup and consistent environments
- Virtual environment isolation for dependencies
- Ready for integration with external services (e.g., databases)
- Secure, minimal Docker image using a non-root user

## Getting Started (Without Docker)

You can run OpenQQuantify locally without Docker by following these steps:

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/OpenQQuantify.git
   cd OpenQQuantify
   ```

2. **Create a virtual environment and activate it:**
   ```sh
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```

4. **Set environment variables (if needed):**
   - Copy `.env.example` to `.env` and edit as required, or set variables directly in your shell.

5. **Run the application:**
   ```sh
   python app.py
   ```
   The Flask app will be available at [http://localhost:5000](http://localhost:5000)

---

## Running the Project with Docker (Optional)

If you prefer Docker, you can use the provided Docker setup for local development and deployment. The Docker configuration is tailored for a Python 3.11 application (using Flask, by default on port 5000) and includes all necessary dependencies and build steps.

### Project-Specific Docker Details

- **Base Image:** `python:3.11-slim` (Python 3.11 is required)
- **Dependencies:** All Python dependencies are installed from `requirements.txt` inside a virtual environment (`.venv`). System dependencies such as `build-essential`, `gcc`, `libpq-dev`, and others are installed for compatibility with common Python packages.
- **Entrypoint:** The container runs `python app.py` as a non-root user (`appuser`).
- **Exposed Port:** `5000` (Flask default)
- **Docker Compose Network:** All services are attached to the `appnet` bridge network.

### Environment Variables

- The Docker Compose file is set up to optionally use a `.env` file (uncomment the `env_file: ./.env` line if you have environment variables to provide). No required environment variables are specified by default, but you may need to provide them depending on your application logic.

### Build and Run Instructions

1. **(Optional) Prepare your `.env` file:**
   - If your application requires environment variables, create a `.env` file in the project root. Uncomment the `env_file` line in `docker-compose.yml` if needed.

2. **Build and start the application:**
   ```sh
   docker compose up --build
   ```
   This will build the Docker image and start the `python-app` service.

3. **Access the application:**
   - The Flask app will be available at [http://localhost:5000](http://localhost:5000)

### Special Configuration Notes

- The Docker build uses a multi-stage approach for smaller final images and better security (non-root user).
- Application code and dependencies are isolated in a virtual environment inside the container.
- If you add external services (e.g., databases), update `docker-compose.yml` accordingly and use the `depends_on` field as needed.

### Ports

- **python-app:** Exposes port `5000` (mapped to host `5000`)

---

_This section was updated to reflect the current Docker setup for this project. Please ensure your local configuration matches any project-specific requirements above._
