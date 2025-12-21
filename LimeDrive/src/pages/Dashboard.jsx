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
            background: 'linear-gradient(135deg, #A9FF00 0%, #7fc700 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(169, 255, 0, 0.2)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3V16M12 16L16 11.625M12 16L8 11.625" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'all 0.2s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'
              e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              e.target.style.color = '#fef2f2'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
              e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)'
              e.target.style.color = '#fca5a5'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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