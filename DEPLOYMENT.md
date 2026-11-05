# 🚀 Deployment Guide — Putting Biodiversity Intelligence AI Live

This guide explains how to take **Biodiversity Intelligence AI** live on the web with its interactive 3D Earth Biosphere and scientific RAG backend.

The application has been unified so that **FastAPI directly serves the 3D interactive frontend and the AI endpoints (`/ask`, `/health`) simultaneously on the same port**. This eliminates CORS issues and allows 1-click cloud deployment.

---

## 📋 Prerequisites
1. **GitHub Repository**: Push your code to a GitHub repository.
2. **Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## 🌟 Option 1: Render.com (Recommended — Fast & Free)

Render provides free hosting for Python web services with automated GitHub deployments.

### Steps:
1. Push your latest code to GitHub:
   ```bash
   git add .
   git commit -m "Elevate UI with 3D Biosphere and unified deployment"
   git push origin main
   ```
2. Go to [render.com](https://render.com) and sign in.
3. Click **"New +"** → **"Web Service"**.
4. Connect your GitHub repository `biodiversity-intelligence-ai`.
5. Configure the deployment settings:
   - **Name**: `biodiversity-intelligence-ai`
   - **Language / Runtime**: `Python 3`
   - **Region**: Choose the closest region to you (e.g., Frankfurt, Oregon, Singapore).
   - **Branch**: `main`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
6. Scroll down to **Environment Variables**:
   - Key: `GEMINI_API_KEY`
   - Value: *(Paste your Gemini API key)*
   - Key: `PYTHON_VERSION`
   - Value: `3.11.9`
7. Click **"Create Web Service"**.
8. Render will build and deploy your app. Once deployed, you'll receive a live URL:
   `https://biodiversity-intelligence-ai.onrender.com`

---

## 🤗 Option 2: Hugging Face Spaces (Free 16GB RAM — Ideal for Vector DBs)

Hugging Face Spaces offers **16 GB of free RAM and 2 vCPUs**, making it extraordinarily fast for sentence embeddings and ChromaDB.

### Steps:
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **"Create new Space"**.
2. Space Name: `biodiversity-intelligence-ai`
3. License: `mit` or `apache-2.0`
4. Space SDK: Select **Docker** (Blank).
5. Hardware: **Free (2 vCPU, 16 GB RAM)**.
6. Click **"Create Space"**.
7. In your Space repository, clone it or connect your GitHub repository.
8. Go to **Settings** → **Variables and secrets** → **New Secret**:
   - Name: `GEMINI_API_KEY`
   - Value: *(Your Gemini API key)*
9. The Space will automatically detect your `Dockerfile` and build the container.
10. Your live public application is immediately available with a custom Hugging Face URL!

---

## 🚂 Option 3: Railway.app

1. Go to [railway.app](https://railway.app).
2. Click **"New Project"** → **"Deploy from GitHub repo"**.
3. Select your repository.
4. Go to **Variables** and add:
   - `GEMINI_API_KEY`: *(Your key)*
   - `PORT`: `8000`
5. Railway will automatically build using either the `Dockerfile` or `Procfile` and assign a live domain under `railway.app`.

---

## 🐳 Option 4: Self-Hosted Docker / VPS (DigitalOcean, AWS, Linode)

To run the container on your own server:

```bash
# 1. Build and run with Docker Compose
docker compose up -d --build

# 2. Check container status
docker ps

# 3. View live logs
docker logs -f biodiversity_intelligence_ai
```

The app will be live at `http://YOUR_SERVER_IP:8000`.

---

## 💻 Local Testing & Verification

Before pushing to the cloud, you can test the entire experience locally:

```powershell
# 1. Activate Python virtual environment
.venv\Scripts\activate

# 2. Start the unified FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open your browser and navigate to:
👉 **`http://127.0.0.1:8000`**

You will see the **Interactive 3D Earth Biosphere**, live layer switchers, hotspot telemetries, and the AI intelligence consultation chat!

