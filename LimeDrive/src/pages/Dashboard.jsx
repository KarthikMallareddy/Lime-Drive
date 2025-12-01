import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import UploadBox from '../components/UploadBox'
import FileList from '../components/FileList'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [refreshFiles, setRefreshFiles] = useState(0)
  const [currentFolderId, setCurrentFolderId] = useState(null)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e0e7ff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#A9FF00',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>
            🍋
          </div>
          <h1 style={{ 
            color: '#1e293b', 
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: '700',
            letterSpacing: '-0.025em'
          }}>
            Lime Drive
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'white'
            }}>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>
              {user?.email}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8fafc'
              e.target.style.borderColor = '#9ca3af'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.borderColor = '#d1d5db'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #e0e7ff'
        }}>
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: '1rem',
              color: '#1e293b',
              fontSize: '2rem',
              fontWeight: '700',
              letterSpacing: '-0.025em'
            }}>
              Welcome to your Drive
            </h2>
            
            <p style={{ 
              color: '#64748b',
              marginBottom: 0,
              fontSize: '1.125rem',
              lineHeight: '1.75'
            }}>
              Your personal cloud storage is ready. Upload and manage your files securely with advanced organization features.
            </p>
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: '2.5rem' }}>
            <UploadBox 
              currentFolderId={currentFolderId}
              onUploadSuccess={() => setRefreshFiles(prev => prev + 1)}
            />
          </div>

          {/* File List */}
          <FileList 
            refreshTrigger={refreshFiles} 
            currentFolderId={currentFolderId}
            setCurrentFolderId={setCurrentFolderId}
          />
        </div>
      </main>
    </div>
  )
}