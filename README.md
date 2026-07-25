<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
  <h1>🤖 AI Code Explainer</h1>
  <p>A Full-Stack AI-Powered Assistant for Explaining, Optimizing, Securing, and Translating Code.</p>
</div>

---

## 📖 Overview

The **AI Code Explainer** is a powerful full-stack application built to empower developers. Using the advanced **Google Gemini API**, it provides deep insights into code snippets, helps catch security vulnerabilities, and enables seamless language translation. 

### 🚀 Key Features

*   **🔍 Code Explanation:** Get a line-by-line breakdown, time/space complexity analysis, and beginner-friendly summaries of any code.
*   **🛡️ Security Analysis:** Run elite Static Application Security Testing (SAST) to identify vulnerabilities, OWASP categories, CVSS scores, and secure remediation fixes.
*   **⚡ Code Optimization:** Automatically rewrite inefficient code and explain the algorithmic improvements.
*   **🌐 Language Translation:** Convert code from one programming language to another with idiomatic correctness.
*   **👤 Authentication & Profiles:** Secure JWT-based authentication with personal user profiles.
*   **📜 History & Tracking:** Automatically saves all your analyses to a MongoDB database so you can revisit past explanations.

---

## 🛠️ Technology Stack

**Frontend:**
*   React 19 + TypeScript
*   Vite 6
*   Tailwind CSS (v4)
*   Monaco Editor
*   Framer Motion (Animations)

**Backend:**
*   Node.js + Express
*   TypeScript
*   MongoDB + Mongoose
*   Google GenAI SDK (`@google/genai`)

---

## 🚦 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/en/) (v18+)
*   [MongoDB](https://www.mongodb.com/) (Local or Atlas)
*   [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory (you can copy `.env.example`) and add your credentials:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_real_api_key_here
   MONGO_URI=mongodb://localhost:27017/ai-code-explainer # Optional: Default uses local mongo
   JWT_SECRET=your_jwt_secret # Optional: Add for secure auth
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *This command spins up both the Vite frontend and Express backend concurrently.*

4. **Open your browser:**
   Navigate to `http://localhost:3000` to start analyzing code!

---

## 📦 Building for Production

To create a highly optimized production build:

```bash
npm run build
npm run start
```
*This will bundle the React frontend into static assets and compile the Express server into a standalone `dist/server.cjs` file using esbuild.*

---

## 🛡️ Error Handling
If you encounter `API_KEY_INVALID` or `model not found` errors, please ensure:
1. You have a valid key from Google AI Studio.
2. Your key has access to the `gemini-flash-latest` model.
3. Your `.env` file is placed in the root directory and contains no typos.
