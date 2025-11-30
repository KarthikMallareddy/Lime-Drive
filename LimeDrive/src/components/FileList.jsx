import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function FileList({ refreshTrigger }) {
  const [files, setFiles] = useState([])
  const [filteredFiles, setFilteredFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
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
      setFilteredFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchFiles()
  }, [user, refreshTrigger])

  // Filter and search files
  useEffect(() => {
    let filtered = [...files]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.filename.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(file => {
        const type = file.content_type || ''
        switch (selectedFilter) {
          case 'images':
            return type.startsWith('image/')
          case 'documents':
            return type.includes('pdf') || 
                   type.includes('document') || 
                   type.includes('text') ||
                   type.includes('msword') ||
                   type.includes('officedocument')
          case 'videos':
            return type.startsWith('video/')
          case 'audio':
            return type.startsWith('audio/')
          default:
            return true
        }
      })
    }

    setFilteredFiles(filtered)
  }, [files, searchTerm, selectedFilter])

  const getFileTypeIcon = (contentType) => {
    if (!contentType) return '📄'
    
    if (contentType.startsWith('image/')) return '🖼️'
    if (contentType.startsWith('video/')) return '🎥'
    if (contentType.startsWith('audio/')) return '🎵'
    if (contentType.includes('pdf')) return '📕'
    if (contentType.includes('document') || contentType.includes('msword') || contentType.includes('officedocument')) return '📄'
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return '📊'
    if (contentType.includes('presentation') || contentType.includes('powerpoint')) return '📈'
    if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('tar')) return '📦'
    
    return '📄'
  }

  const deleteFile = async (file) => {
    if (!confirm('Delete "' + file.filename + '"?')) return

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

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px',
      border: '1px solid #eee',
      overflow: 'hidden'
    }}>
      {/* Search and Filter Header */}
      <div style={{
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #eee'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ fontWeight: 'bold', color: '#333' }}>
            Your Files ({filteredFiles.length} of {files.length})
          </div>
          
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.9rem',
              minWidth: '200px',
              flex: '1',
              maxWidth: '300px'
            }}
          />
        </div>

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'all', label: 'All Files', icon: '📁' },
            { key: 'images', label: 'Images', icon: '🖼️' },
            { key: 'documents', label: 'Documents', icon: '📄' },
            { key: 'videos', label: 'Videos', icon: '🎥' },
            { key: 'audio', label: 'Audio', icon: '🎵' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: selectedFilter === filter.key ? '#A9FF00' : 'white',
                color: selectedFilter === filter.key ? '#000' : '#666',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <span>{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {files.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: '#999'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📁</div>
          <p>No files uploaded yet</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#999'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
          <p>No files match your search</p>
        </div>
      ) : null}

      {filteredFiles.map((file) => (
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
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>{getFileTypeIcon(file.content_type)}</span>
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