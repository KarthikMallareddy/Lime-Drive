import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ShareModal({ file, folder, onClose }) {
  const [loading, setLoading] = useState(false)
  const [shareData, setShareData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const item = file || folder
  const itemType = file ? 'file' : 'folder'
  const itemName = file?.filename || folder?.name

  const createShare = async () => {
    if (!item) return

    setLoading(true)
    setError('')

    try {
      // Get user session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Please log in to create shares')
      }

      // Create share via API
      const response = await fetch('/api/create-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file?.id || null,
          folderId: folder?.id || null,
          shareType: 'public',
          permissions: 'download',
          token: session.access_token
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create share')
      }

      const result = await response.json()
      setShareData({
        ...result.share,
        url: `${window.location.origin}/share/${result.share.token}`
      })

    } catch (err) {
      console.error('Share creation error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!shareData?.url) return

    try {
      await navigator.clipboard.writeText(shareData.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareData.url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        minWidth: '480px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e0e7ff'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ 
            margin: 0, 
            color: '#1e293b',
            fontSize: '1.5rem',
            fontWeight: '700'
          }}>
            Share {itemType}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#64748b',
              padding: '0.5rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Item Info */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>
            {itemType === 'file' ? '📄' : '📁'}
          </span>
          <div>
            <div style={{ 
              fontWeight: '600', 
              color: '#1e293b',
              fontSize: '1rem'
            }}>
              {itemName}
            </div>
            <div style={{ 
              color: '#64748b', 
              fontSize: '0.875rem' 
            }}>
              {itemType === 'file' ? `${Math.round(item.size / 1024)} KB` : 'Folder'}
            </div>
          </div>
        </div>

        {!shareData ? (
          /* Create Share */
          <div>
            <p style={{ 
              color: '#64748b',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              Create a public share link that anyone can use to access this {itemType}.
            </p>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>⚠️</span>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={createShare}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: loading ? '#9ca3af' : '#A9FF00',
                  color: '#000',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {loading ? 'Creating...' : 'Create Share Link'}
              </button>
            </div>
          </div>
        ) : (
          /* Share Created */
          <div>
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: '#16a34a' }}>✅</span>
                <span style={{ 
                  color: '#16a34a', 
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}>
                  Share link created successfully!
                </span>
              </div>
              <p style={{
                color: '#15803d',
                fontSize: '0.875rem',
                margin: 0
              }}>
                Anyone with this link can {shareData.permissions} your {itemType}.
              </p>
            </div>

            {/* Share URL */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#1e293b',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Share Link
              </label>
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                <input
                  type="text"
                  value={shareData.url}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: '#f8fafc',
                    color: '#1e293b'
                  }}
                />
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: copied ? '#A9FF00' : 'white',
                    color: copied ? '#000' : '#64748b',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease-in-out',
                    minWidth: '80px'
                  }}
                >
                  {copied ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}