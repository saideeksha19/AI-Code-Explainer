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
=======
# 🤖 AI Code Explainer

An AI-powered full-stack developer assistant that helps programmers understand, analyze, translate, and improve their code using Google's Gemini AI.

AI Code Explainer provides intelligent code explanations, security vulnerability detection, optimization suggestions, and programming language translation through an interactive web interface.

---

## 📌 Overview

Developers often spend time understanding complex code, debugging errors, identifying security issues, and improving performance.

**AI Code Explainer** solves this problem by using Generative AI to analyze source code and provide:

- Detailed code explanations
- Line-by-line breakdowns
- Complexity analysis
- Security vulnerability detection
- Code optimization suggestions
- Programming language translation
- Historical tracking of previous analyses

The application acts as an AI coding companion that helps beginners learn programming and assists experienced developers with code review.

---

# 🚀 Features

## 🔍 AI Code Explanation

Analyze any programming code and receive:

- Beginner-friendly explanation
- Line-by-line analysis
- Code functionality summary
- Time complexity analysis
- Space complexity analysis
- Best practice suggestions


## 🛡️ Security Analysis

AI-powered security review to identify:

- Potential vulnerabilities
- Unsafe coding practices
- Security risks
- OWASP-related issues
- Recommended fixes and improvements


## ⚡ Code Optimization

Improve existing code by:

- Detecting inefficient logic
- Suggesting optimized solutions
- Improving readability
- Explaining performance improvements


## 🌐 Code Translation

Convert code between programming languages while maintaining:

- Correct syntax
- Similar functionality
- Language-specific best practices


Example:

```
JavaScript → TypeScript
Python → Java
C++ → Python
```


## 👤 Authentication System

Secure user management with:

- User registration
- Login/logout
- JWT authentication
- User profiles
- Protected routes


## 📜 Analysis History

Users can:

- Save previous code analyses
- View past explanations
- Track their AI interactions


## 🎨 Modern User Interface

Includes:

- Responsive design
- Dark/light theme support
- Interactive code editor
- Smooth animations
- Developer-friendly interface


---

# 🏗️ System Architecture


```
                 User
                  |
                  |
                  v
        React + TypeScript Frontend
                  |
                  |
                  v
          Express Backend API
                  |
        --------------------
        |                  |
        v                  v
   Gemini AI API       MongoDB Database
        |
        |
        v
 AI Generated Analysis
```


---

# 🛠️ Technology Stack


## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Monaco Editor
- Framer Motion


## Backend

- Node.js
- Express.js
- TypeScript
- REST APIs


## Database

- MongoDB
- Mongoose


## Artificial Intelligence

- Google Gemini API
- Google GenAI SDK (`@google/genai`)


## Authentication

- JWT Authentication
- Secure session handling


---

# 📂 Project Structure


```
AI-Code-Explainer
│
├── src
│   ├── frontend components
│   ├── backend services
│   ├── API routes
│   └── utilities
│
├── server.ts
├── package.json
├── vite.config.ts
├── .env.example
└── README.md
```


---

# ⚙️ Installation & Setup


## Prerequisites

Install:

- Node.js v18+
- MongoDB
- Google Gemini API Key


---

## 1. Clone Repository


```bash
git clone https://github.com/your-username/AI-Code-Explainer.git

cd AI-Code-Explainer
```


---

## 2. Install Dependencies


```bash
npm install
```


---

## 3. Configure Environment Variables


Create a `.env` file:


```env
PORT=3000

GEMINI_API_KEY=your_gemini_api_key

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
```


⚠️ Never upload `.env` files or API keys to GitHub.


---

## 4. Start Development Server


```bash
npm run dev
```


The application will start at:


```
http://localhost:3000
```


---

# 🏭 Production Build


Create optimized production files:


```bash
npm run build
```


Start production server:


```bash
npm run start
```


---

# 🔐 Security Features

The project includes:

- JWT-based authentication
- Protected API routes
- Secure environment variables
- Input validation
- Error handling
- API key protection


---

# 🧪 Example Usage


Input:

```python
for i in range(5):
    print(i)
```


AI Output:

```
This loop executes five times and prints values from 0 to 4.

Time Complexity:
O(n)

Space Complexity:
O(1)
```


---

# 🎯 Future Enhancements

Planned improvements:

- AI debugging assistant
- Automatic unit test generation
- GitHub repository analysis
- Code documentation generation
- Voice-based coding assistant
- Multi-file project analysis
- Developer analytics dashboard


---

# 🤝 Contributing

Contributions are welcome.

Steps:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request


---

# 📄 License

This project is licensed under the MIT License.


---

# 👩‍💻 Author

**Sai Deeksha**

AI & Machine Learning Engineering Student

---

⭐ If you find this project useful, consider giving it a star!
>>>>>>> f82a27c9e99feb652e185ade056f75adf4903622
