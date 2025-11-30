import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import UploadBox from '../components/UploadBox'
import FileList from '../components/FileList'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [refreshFiles, setRefreshFiles] = useState(0)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Inter, system-ui, Arial'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ 
          color: '#A9FF00', 
          margin: 0,
          fontSize: '1.5rem'
        }}>
          Lime Drive
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#666' }}>
            {user?.email}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: '1rem',
            color: '#333'
          }}>
            Welcome to your Drive
          </h2>
          
          <p style={{ 
            color: '#666',
            marginBottom: '2rem'
          }}>
            Your personal cloud storage is ready. Upload and manage your files securely.
          </p>

          {/* File Upload */}
          <div style={{ marginBottom: '2rem' }}>
            <UploadBox 
              onUploadSuccess={() => setRefreshFiles(prev => prev + 1)}
            />
          </div>

          {/* File List */}
          <FileList refreshTrigger={refreshFiles} />
        </div>
      </main>
    </div>
  )
}