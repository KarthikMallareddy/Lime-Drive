import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../hooks/useAuth'

export default function FileList({ refreshTrigger, currentFolderId, setCurrentFolderId }) {
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [filteredFiles, setFilteredFiles] = useState([])
  const [filteredFolders, setFilteredFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Home' }])
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [fileToMove, setFileToMove] = useState(null)
  const [allFolders, setAllFolders] = useState([])
  const [selectedMoveFolder, setSelectedMoveFolder] = useState(null)
  const { user } = useAuth()

  const fetchFiles = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch files in current folder
      const filesQuery = supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (currentFolderId) {
        filesQuery.eq('folder_id', currentFolderId)
      } else {
        filesQuery.is('folder_id', null)
      }
      
      const { data: filesData, error: filesError } = await filesQuery
      if (filesError) throw filesError
      
      // Fetch folders in current directory
      const foldersQuery = supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
      
      if (currentFolderId) {
        foldersQuery.eq('parent_id', currentFolderId)
      } else {
        foldersQuery.is('parent_id', null)
      }
      
      const { data: foldersData, error: foldersError } = await foldersQuery
      if (foldersError) throw foldersError
      
      setFiles(filesData || [])
      setFolders(foldersData || [])
      setFilteredFiles(filesData || [])
      setFilteredFolders(foldersData || [])
    } catch (error) {
      console.error('Error fetching files and folders:', error.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchFiles()
    updateBreadcrumbs()
  }, [user, refreshTrigger, currentFolderId])

  const updateBreadcrumbs = async () => {
    if (!currentFolderId) {
      setBreadcrumbs([{ id: null, name: 'Home' }])
      return
    }
    
    try {
      const path = []
      let folderId = currentFolderId
      
      while (folderId) {
        const { data, error } = await supabase
          .from('folders')
          .select('id, name, parent_id')
          .eq('id', folderId)
          .single()
        
        if (error) throw error
        path.unshift({ id: data.id, name: data.name })
        folderId = data.parent_id
      }
      
      setBreadcrumbs([{ id: null, name: 'Home' }, ...path])
    } catch (error) {
      console.error('Error building breadcrumbs:', error.message)
    }
  }
  
  const fetchAllFolders = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('id, name, parent_id')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
      
      if (error) throw error
      setAllFolders(data || [])
    } catch (error) {
      console.error('Error fetching all folders:', error.message)
    }
  }
  
  const openMoveModal = (file) => {
    setFileToMove(file)
    setSelectedMoveFolder(null)
    setShowMoveModal(true)
    fetchAllFolders()
  }
  
  const moveFile = async () => {
    if (!fileToMove) return
    
    try {
      const { error } = await supabase
        .from('files')
        .update({ folder_id: selectedMoveFolder })
        .eq('id', fileToMove.id)
      
      if (error) throw error
      
      setShowMoveModal(false)
      setFileToMove(null)
      setSelectedMoveFolder(null)
      fetchFiles()
    } catch (error) {
      console.error('Error moving file:', error.message)
      alert('Failed to move file: ' + error.message)
    }
  }
  
  const buildFolderPath = (folderId, folders) => {
    if (!folderId) return 'Home'
    
    const path = []
    let currentId = folderId
    
    while (currentId) {
      const folder = folders.find(f => f.id === currentId)
      if (!folder) break
      path.unshift(folder.name)
      currentId = folder.parent_id
    }
    
    return path.length > 0 ? 'Home / ' + path.join(' / ') : 'Home'
  }

  // Filter and search files and folders
  useEffect(() => {
    let filteredFilesResult = [...files]
    let filteredFoldersResult = [...folders]

    // Apply search filter
    if (searchTerm) {
      filteredFilesResult = filteredFilesResult.filter(file => 
        file.filename.toLowerCase().includes(searchTerm.toLowerCase())
      )
      filteredFoldersResult = filteredFoldersResult.filter(folder => 
        folder.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply type filter (only affects files)
    if (selectedFilter !== 'all' && selectedFilter !== 'folders') {
      filteredFilesResult = filteredFilesResult.filter(file => {
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
    
    // If 'folders' filter is selected, only show folders
    if (selectedFilter === 'folders') {
      filteredFilesResult = []
    }

    setFilteredFiles(filteredFilesResult)
    setFilteredFolders(filteredFoldersResult)
  }, [files, folders, searchTerm, selectedFilter])

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    
    try {
      const { error } = await supabase
        .from('folders')
        .insert([{
          name: newFolderName.trim(),
          user_id: user.id,
          parent_id: currentFolderId
        }])
      
      if (error) throw error
      
      setNewFolderName('')
      setShowNewFolderInput(false)
      fetchFiles()
    } catch (error) {
      console.error('Error creating folder:', error.message)
      alert('Failed to create folder: ' + error.message)
    }
  }
  
  const deleteFolder = async (folder) => {
    if (!confirm(`Delete folder "${folder.name}" and all its contents?`)) return
    
    try {
      // Delete folder (cascade will handle contents)
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folder.id)
      
      if (error) throw error
      fetchFiles()
    } catch (error) {
      console.error('Error deleting folder:', error.message)
      alert('Failed to delete folder: ' + error.message)
    }
  }
  
  const navigateToFolder = (folderId) => {
    setCurrentFolderId(folderId)
  }

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
        {/* Breadcrumbs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id || 'home'} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => navigateToFolder(crumb.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: index === breadcrumbs.length - 1 ? '#333' : '#0066cc',
                  cursor: index === breadcrumbs.length - 1 ? 'default' : 'pointer',
                  textDecoration: 'none',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: index === breadcrumbs.length - 1 ? 'bold' : 'normal'
                }}
                disabled={index === breadcrumbs.length - 1}
              >
                {crumb.name}
              </button>
              {index < breadcrumbs.length - 1 && <span style={{ margin: '0 0.5rem' }}>→</span>}
            </div>
          ))}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ fontWeight: 'bold', color: '#333' }}>
            {folders.length + files.length > 0 ? 
              `${filteredFolders.length + filteredFiles.length} items (${filteredFolders.length} folders, ${filteredFiles.length} files)` :
              'Empty folder'
            }
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* New Folder Button */}
            <button
              onClick={() => setShowNewFolderInput(true)}
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
              📁 New Folder
            </button>
            
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem',
                minWidth: '200px',
                maxWidth: '300px'
              }}
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'all', label: 'All', icon: '📁' },
            { key: 'folders', label: 'Folders', icon: '📂' },
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
        
        {/* New Folder Input */}
        {showNewFolderInput && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Create New Folder</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                autoFocus
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                style={{
                  backgroundColor: '#A9FF00',
                  color: '#000',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: newFolderName.trim() ? 'pointer' : 'not-allowed',
                  opacity: newFolderName.trim() ? 1 : 0.5
                }}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewFolderInput(false)
                  setNewFolderName('')
                }}
                style={{
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  border: '1px solid #ddd',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {files.length === 0 && folders.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: '#999'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📁</div>
          <p>This folder is empty</p>
          <p style={{ fontSize: '0.9rem' }}>Upload files or create folders to get started</p>
        </div>
      ) : filteredFiles.length === 0 && filteredFolders.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#999'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
          <p>No items match your search</p>
        </div>
      ) : null}

      {/* Folders */}
      {filteredFolders.map((folder) => (
        <div
          key={folder.id}
          style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            ':hover': { backgroundColor: '#f8f9fa' }
          }}
          onClick={() => navigateToFolder(folder.id)}
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
              <span style={{ fontSize: '1.2rem' }}>📁</span>
              {folder.name}
            </div>
            <div style={{ 
              fontSize: '0.85rem', 
              color: '#666'
            }}>
              Folder • {formatDate(folder.created_at)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteFolder(folder)
              }}
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

      {/* Files */}
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
              onClick={() => openMoveModal(file)}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Move
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
      
      {/* Move File Modal */}
      {showMoveModal && (
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
            borderRadius: '8px',
            padding: '2rem',
            minWidth: '400px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Move File</h3>
            <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
              Move "{fileToMove?.filename}" to a folder:
            </p>
            
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              maxHeight: '300px',
              overflow: 'auto',
              marginBottom: '1rem'
            }}>
              {/* Home/Root option */}
              <div
                onClick={() => setSelectedMoveFolder(null)}
                style={{
                  padding: '0.75rem',
                  cursor: 'pointer',
                  backgroundColor: selectedMoveFolder === null ? '#e3f2fd' : 'white',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>🏠</span>
                <span style={{ fontWeight: selectedMoveFolder === null ? 'bold' : 'normal' }}>
                  Home (Root)
                </span>
              </div>
              
              {/* Folder options */}
              {allFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setSelectedMoveFolder(folder.id)}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    backgroundColor: selectedMoveFolder === folder.id ? '#e3f2fd' : 'white',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>📁</span>
                  <div>
                    <div style={{ fontWeight: selectedMoveFolder === folder.id ? 'bold' : 'normal' }}>
                      {folder.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {buildFolderPath(folder.parent_id, allFolders)}
                    </div>
                  </div>
                </div>
              ))}
              
              {allFolders.length === 0 && (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  No folders available. Create a folder first to move files into it.
                </div>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowMoveModal(false)
                  setFileToMove(null)
                  setSelectedMoveFolder(null)
                }}
                style={{
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  border: '1px solid #ddd',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={moveFile}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Move File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}