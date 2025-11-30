import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function FileList({ refreshTrigger }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchFiles = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [user, refreshTrigger])

  const deleteFile = async (file) => {
    if (!confirm(`Delete "${file.filename}"?`)) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('users')
        .remove([file.path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      // Refresh file list
      fetchFiles()
    } catch (error) {
      console.error('Delete error:', error.message)
      alert('Delete failed: ' + error.message)
    }
  }

  const downloadFile = async (file) => {
    try {
      const { data, error } = await supabase.storage
        .from('users')
        .download(file.path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error.message)
      alert('Download failed: ' + error.message)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
        Loading files...
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem', 
        color: '#999',
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        border: '1px solid #eee'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📁</div>
        <p>No files uploaded yet</p>
      </div>
    )
  }

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px',
      border: '1px solid #eee',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #eee',
        fontWeight: 'bold',
        color: '#333'
      }}>
        Your Files ({files.length})
      </div>

      {files.map((file) => (
        <div
          key={file.id}
          style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            ':last-child': { borderBottom: 'none' }
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '0.25rem',
              color: '#333'
            }}>
              {file.filename}
            </div>
            <div style={{ 
              fontSize: '0.85rem', 
              color: '#666',
              display: 'flex',
              gap: '1rem'
            }}>
              <span>{formatFileSize(file.size)}</span>
              <span>{formatDate(file.created_at)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => downloadFile(file)}
              style={{
                backgroundColor: '#A9FF00',
                color: '#000',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              Download
            </button>
            <button
              onClick={() => deleteFile(file)}
              style={{
                backgroundColor: '#ff4757',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}