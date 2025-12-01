import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function UploadBox({ currentFolderId, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const { user } = useAuth()

  const uploadFile = async (file) => {
    if (!file || !user) {
      console.error('Upload failed: Missing file or user', { file: !!file, user: !!user })
      return
    }

    setUploading(true)
    try {
      // Verify user session is still valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Authentication session expired. Please log in again.')
      }

      // Create unique filename with timestamp
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileName = `${timestamp}-${file.name}`
      const filePath = `${user.id}/${fileName}`  // Remove 'users/' prefix

      console.log('Upload details:', { userId: user.id, filePath, fileName })

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('users')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Insert file metadata into database
      const { error: dbError } = await supabase
        .from('files')
        .insert([{
          user_id: user.id,
          path: filePath,
          filename: file.name,
          size: file.size,
          content_type: file.type || 'application/octet-stream',
          folder_id: currentFolderId
        }])

      if (dbError) {
        console.error('Database error:', dbError)
        throw dbError
      }

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess()
      }

      console.log('File uploaded successfully:', fileName)
    } catch (error) {
      console.error('Upload error:', error)
      
      // If storage upload succeeded but database failed, try to clean up
      if (error.message.includes('row-level security policy')) {
        console.error('RLS Policy Error - User ID:', user.id)
        alert('Upload failed: Authentication issue. Please try logging out and back in.')
      } else {
        alert('Upload failed: ' + error.message)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      uploadFile(files[0]) // Upload first file
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragActive ? '#A9FF00' : '#d1d5db'}`,
        borderRadius: '12px',
        padding: '3rem 2rem',
        textAlign: 'center',
        backgroundColor: dragActive ? '#f0fdf4' : '#f8fafc',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        transform: dragActive ? 'scale(1.02)' : 'scale(1)',
        boxShadow: dragActive 
          ? '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}
    >
      <input
        type="file"
        onChange={handleFileSelect}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer'
        }}
        disabled={uploading}
      />

      {uploading ? (
        <div>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem',
            animation: 'bounce 1s infinite'
          }}>
            ☁️
          </div>
          <p style={{ 
            color: '#3b82f6', 
            margin: 0,
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>
            Uploading your file...
          </p>
          <div style={{
            width: '200px',
            height: '4px',
            backgroundColor: '#e5e7eb',
            borderRadius: '2px',
            margin: '1rem auto 0',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#A9FF00',
              borderRadius: '2px',
              animation: 'progress 2s ease-in-out infinite'
            }} />
          </div>
        </div>
      ) : (
        <div>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '1.5rem',
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
          }}>
            ☁️
          </div>
          <p style={{ 
            color: '#1e293b', 
            fontSize: '1.25rem', 
            marginBottom: '0.75rem',
            fontWeight: '700',
            letterSpacing: '-0.025em'
          }}>
            Drop files here or click to browse
          </p>
          <p style={{ 
            color: '#64748b', 
            margin: 0, 
            fontSize: '1rem',
            lineHeight: '1.5'
          }}>
            {currentFolderId 
              ? '📁 Upload to current folder' 
              : '🏠 Upload to your personal cloud storage'
            }
          </p>
          <div style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'rgba(169, 255, 0, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(169, 255, 0, 0.3)',
            display: 'inline-block'
          }}>
            <span style={{
              color: '#16a34a',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              ✨ Supports all file types
            </span>
          </div>
        </div>
      )}
      
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
              transform: translate3d(0,0,0);
            }
            40%, 43% {
              transform: translate3d(0, -8px, 0);
            }
            70% {
              transform: translate3d(0, -4px, 0);
            }
            90% {
              transform: translate3d(0, -2px, 0);
            }
          }
          
          @keyframes progress {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}
      </style>
    </div>
  )
}