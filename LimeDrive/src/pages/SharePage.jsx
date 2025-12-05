import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function SharePage() {
  const [shareData, setShareData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadLoading, setDownloadLoading] = useState(false)
  const { token } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    validateShare()
  }, [token])

  const validateShare = async () => {
    if (!token) {
      setError('Invalid share link')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/validate-share?token=${token}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Share not found or expired')
      }

      const result = await response.json()
      setShareData(result)

    } catch (err) {
      console.error('Share validation error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async () => {
    if (!shareData?.file?.path) return

    setDownloadLoading(true)
    try {
      // Get signed URL for download
      const response = await fetch('/api/get-signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: shareData.file.path,
          shareToken: token // Pass the share token for validation
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get download URL')
      }

      const { signedUrl } = await response.json()

      // Create download link
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = shareData.file.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download file: ' + err.message)
    } finally {
      setDownloadLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return Math.round(bytes / (1024 * 1024)) + ' MB'
    return Math.round(bytes / (1024 * 1024 * 1024)) + ' GB'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
          minWidth: '400px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #A9FF00',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#64748b', margin: 0 }}>Validating share...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem'
          }}>
            🚫
          </div>
          <h2 style={{
            color: '#1e293b',
            marginBottom: '1rem',
            fontSize: '1.5rem'
          }}>
            Share Not Available
          </h2>
          <p style={{
            color: '#64748b',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Go to LimeDrive
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '1rem 2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '2rem' }}>🟢</span>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'white'
            }}>
              LimeDrive
            </span>
          </div>
          
          <div style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.875rem'
          }}>
            Shared {shareData.file ? 'File' : 'Folder'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        padding: '3rem 2rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '3rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {shareData.file ? (
            /* File Share */
            <div>
              {/* File Icon & Name */}
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '1rem'
                }}>
                  📄
                </div>
                <h1 style={{
                  color: '#1e293b',
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  wordBreak: 'break-word'
                }}>
                  {shareData.file.filename}
                </h1>
                <div style={{
                  color: '#64748b',
                  fontSize: '1rem'
                }}>
                  {formatFileSize(shareData.file.size)} • Shared on {formatDate(shareData.created_at)}
                </div>
              </div>

              {/* File Details */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  display: 'grid',
                  gap: '1rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                }}>
                  <div>
                    <div style={{
                      color: '#64748b',
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem'
                    }}>
                      File Type
                    </div>
                    <div style={{
                      color: '#1e293b',
                      fontWeight: '600'
                    }}>
                      {shareData.file.filename.split('.').pop().toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      color: '#64748b',
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem'
                    }}>
                      Views
                    </div>
                    <div style={{
                      color: '#1e293b',
                      fontWeight: '600'
                    }}>
                      {shareData.view_count || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      color: '#64748b',
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem'
                    }}>
                      Permissions
                    </div>
                    <div style={{
                      color: '#1e293b',
                      fontWeight: '600'
                    }}>
                      {shareData.permissions === 'download' ? 'Download' : 'View Only'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div style={{
                textAlign: 'center'
              }}>
                <button
                  onClick={downloadFile}
                  disabled={downloadLoading || shareData.permissions !== 'download'}
                  style={{
                    backgroundColor: shareData.permissions === 'download' ? '#A9FF00' : '#9ca3af',
                    color: '#000',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '12px',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    cursor: shareData.permissions === 'download' ? (downloadLoading ? 'not-allowed' : 'pointer') : 'not-allowed',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '0 auto'
                  }}
                >
                  {downloadLoading ? (
                    <>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid transparent',
                        borderTop: '2px solid #000',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      📥 {shareData.permissions === 'download' ? 'Download File' : 'Download Disabled'}
                    </>
                  )}
                </button>
                
                {shareData.permissions !== 'download' && (
                  <p style={{
                    color: '#64748b',
                    fontSize: '0.875rem',
                    marginTop: '1rem'
                  }}>
                    This file is view-only. Download permission not granted.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Folder Share */
            <div>
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '1rem'
                }}>
                  📁
                </div>
                <h1 style={{
                  color: '#1e293b',
                  fontSize: '2rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem'
                }}>
                  {shareData.folder.name}
                </h1>
                <div style={{
                  color: '#64748b',
                  fontSize: '1rem'
                }}>
                  Shared folder • {shareData.view_count || 0} views
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                color: '#64748b'
              }}>
                <p>Folder sharing is coming soon!</p>
                <p style={{ fontSize: '0.875rem' }}>
                  This feature will allow you to browse and download files within shared folders.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🟢</span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                LimeDrive
              </span>
            </div>
            <p style={{
              color: '#64748b',
              fontSize: '0.875rem',
              margin: 0
            }}>
              Secure cloud storage and file sharing
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: '1rem',
                backgroundColor: 'transparent',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Get Your Own LimeDrive
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}