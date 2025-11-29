# Lime Drive  
### A Personal Cloud Storage System Built with React and Supabase

Lime Drive is a lightweight, secure cloud storage application that I built for my personal use to organize, store, and retrieve files privately across devices.  
Unlike general-purpose cloud storage solutions, Lime Drive is intentionally minimal, privacy-focused, and tailored specifically to my workflow.

---

## Purpose of This Project

Commercial cloud platforms often include features I do not need, while lacking the transparency and control I prefer.  
To address this, I created Lime Drive as a personal cloud system that allows me to:

- Manage files in a clean, distraction-free interface  
- Control how data is stored and accessed  
- Understand every layer of the system’s architecture  
- Apply secure storage practices using modern tools  

Lime Drive is both a personal archive and a full-stack learning project designed around real daily use.

---

## Features

- User authentication (Supabase Auth)  
- Private file storage in Supabase Storage  
- Row-Level Security (RLS) enforcing user isolation  
- Direct file uploads to private buckets  
- Metadata stored in Postgres (filename, size, path, type, timestamp)  
- Dashboard listing personal uploaded files  
- Secure downloads through short-lived signed URLs  
- Delete functionality (storage + metadata)  
- Minimal and fast UI built with React + Vite  

---

## Technology Stack

### Frontend
- React (with Vite)
- Supabase JavaScript Client
- React Router

### Backend
- Supabase Auth  
- Supabase Storage  
- Supabase Postgres  
- Serverless functions (Vercel or Netlify) for generating signed URLs  

---

## Project Structure
lime-drive/
│
├── .env.local
├── index.html
├── package.json
├── vite.config.js
│
├── src/
│ ├── App.jsx
│ ├── supabaseClient.js
│ ├── hooks/
│ │ └── useAuth.js
│ ├── components/
│ │ └── UploadBox.jsx
│ └── pages/
│ ├── Login.jsx
│ ├── Register.jsx
│ └── Dashboard.jsx
│
└── api/
└── get-signed-url.js

