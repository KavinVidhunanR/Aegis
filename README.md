<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AEGIS: AI Wellbeing Coach

This repository contains the source code for AEGIS, an AI coach designed to support wellbeing.

## Deploying Your Application

This project is configured for a professional, secure deployment on [Vercel](https://vercel.com/).

### 1. Fork & Clone Repository
First, fork this repository to your own GitHub account, and then clone it to your local machine.

### 2. Deploy to Vercel
1.  Go to [vercel.com](https://vercel.com/) and sign up or log in.
2.  Click **Add New...** > **Project**.
3.  Import the GitHub repository you just forked.
4.  In the **Configure Project** screen, expand the **Environment Variables** section.
5.  Add a new variable:
    *   **Name**: `API_KEY`
    *   **Value**: Paste your Gemini API key here.
6.  Click **Deploy**. Vercel will automatically build and deploy your application.

## Running Locally

To run the application locally in a way that mimics the Vercel production environment (including the secure serverless function), you should use the Vercel CLI.

1.  **Install Vercel CLI:**
    ```bash
    npm i -g vercel
    ```

2.  **Link Your Project:**
    In your project's root directory, link it to your Vercel project.
    ```bash
    vercel link
    ```

3.  **Pull Environment Variables:**
    This will create a `.env` file in your local directory containing the `API_KEY` you set in the Vercel dashboard.
    ```bash
    vercel env pull .env.local
    ```

4.  **Run the Development Server:**
    ```bash
    vercel dev
    ```
    This command starts a local server (usually on `http://localhost:3000`) that runs your frontend app and your serverless function in `api/`.
