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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Navigation Header */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)'
          }}>
            ☁️
          </div>
          <div>
            <h1 style={{ 
              color: '#f1f5f9', 
              margin: '0 0 0.25rem 0',
              fontSize: '1.5rem',
              fontWeight: '700',
              letterSpacing: '-0.5px'
            }}>
              LimeDrive
            </h1>
            <p style={{
              color: '#94a3b8',
              margin: 0,
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              Secure Cloud Storage
            </p>
          </div>
        </div>

        {/* User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: '700'
            }}>
              {user?.email?.[0].toUpperCase()}
            </div>
            <div>
              <p style={{
                color: '#f1f5f9',
                margin: 0,
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {user?.email?.split('@')[0]}
              </p>
              <p style={{
                color: '#94a3b8',
                margin: 0,
                fontSize: '0.75rem'
              }}>
                Pro Account
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(148, 163, 184, 0.2)'
              e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(148, 163, 184, 0.1)'
              e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Upload Section */}
        <section style={{
          marginBottom: '3rem'
        }}>
          <h2 style={{
            color: '#f1f5f9',
            marginBottom: '1rem',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            Upload Files
          </h2>
          <UploadBox 
            currentFolderId={currentFolderId}
            onUploadSuccess={() => setRefreshFiles(r => r + 1)}
          />
        </section>

        {/* Files Section */}
        <section>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              color: '#f1f5f9',
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              Your Files
            </h2>
            <div style={{
              color: '#94a3b8',
              fontSize: '0.875rem'
            }}>
              Manage & Share
            </div>
          </div>

          <FileList 
            refreshTrigger={refreshFiles}
            currentFolderId={currentFolderId}
            setCurrentFolderId={setCurrentFolderId}
          />
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '2rem',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.875rem',
        marginTop: '4rem'
      }}>
        <p>© 2025 LimeDrive. Secure cloud storage for everyone.</p>
      </footer>
    </div>
  )
}