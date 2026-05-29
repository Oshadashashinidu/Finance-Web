# Finance Web

Full-stack finance onboarding app with a React (Vite) frontend and Spring Boot backend.

## 🚀 Launch App

<a href="https://financeweb-24k3fxgwy-oshada-s-projects.vercel.app/" target="_blank">
  <img src="https://img.shields.io/badge/Launch%20Me-Open%20App-blue?style=for-the-badge" alt="Launch App"/>
</a>

## Quick start

### Backend (Node.js)

1. Update the database config file at backend/config/db.config.json with your credentials.
2. Run the backend:

```bash
cd backend
npm install
npm start
```

### Frontend

1. Copy frontend/.env.example to frontend/.env and set VITE_API_BASE_URL if needed.
2. Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

## API endpoints

- POST /api/companies/register
- POST /api/companies/login

## Notes

- The signup form includes an image upload. The backend currently accepts the image fields but does not store them because the companies table does not include image columns.
