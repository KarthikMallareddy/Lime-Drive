import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function UploadBox({ onUploadSuccess }) {
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
          content_type: file.type || 'application/octet-stream'
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
        border: `2px dashed ${dragActive ? '#A9FF00' : '#ddd'}`,
        borderRadius: '8px',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: dragActive ? '#f8fff8' : '#fafafa',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        position: 'relative'
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
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#666', margin: 0 }}>Uploading...</p>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>☁️</div>
          <p style={{ 
            color: '#333', 
            fontSize: '1.1rem', 
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            Drop files here or click to browse
          </p>
          <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
            Upload any file to your personal cloud storage
          </p>
        </div>
      )}
    </div>
  )
}