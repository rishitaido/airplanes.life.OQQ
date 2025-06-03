[![Contribute](https://img.shields.io/badge/Contribute-Here-blue)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/CoC-Important-red)](CODE_OF_CONDUCT.md)

# AI + 3D Model Viewer 🌐🤖🧊

This project is an interactive web application that integrates AI chat with 3D model visualization using Flask (Python), HTML/CSS, and JavaScript with Three.js.

## 🔥 Features

- 💬 **AI Chatbot**: Ask questions or chat with an integrated AI model (via Flask API).
- 🧊 **3D Model Viewer**: Load `.glb` or `.gltf` 3D models dynamically from a JSON configuration.
- 📁 **Modular Flask App**: Clean project structure with Blueprints for scalable development.
- 🌐 **Responsive UI**: Styled with CSS custom variables and mobile-friendly layout.
- 🎨 **Dark Theme**: A sleek, dark-themed user interface using modern CSS.

---

## 🛠 Tech Stack

- **Backend**: Python 3.10+, Flask
- **Frontend**: HTML, CSS, JavaScript
- **3D Rendering**: [Three.js](https://threejs.org/)
- **AI Integration**: Custom API or third-party LLM endpoints (OpenAI, Hugging Face, etc.)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-3d-viewer.git
cd ai-3d-viewer

python3 -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

pip install -r requirements.txt

export FLASK_APP=app
export FLASK_ENV=development
flask run


