import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import App from './App.tsx'
import BookList from './pages/BookList'
import BookReader from './pages/BookReader'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/book" element={<BookList />} />
          <Route path="/book/:id" element={<BookReader />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </StrictMode>,
)
