# SWSAI Document Hub

Full-stack document management dashboard built with React, Node.js, Express, and MongoDB.

## First Feature: PDF Uploads

- Single PDF upload
- Bulk PDF upload, up to 20 files per request
- Client-side PDF filtering
- Upload progress bar with loading states
- Document metadata stored in MongoDB
- White and blue dashboard UI using the Livvic font

## Run Locally

```bash
npm run install:all
npm run dev
```

Client: `http://localhost:5173`

Server: `http://localhost:5001`

The server reads MongoDB configuration from `server/.env`.
