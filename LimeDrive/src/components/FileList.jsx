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
  const [showActionModal, setShowActionModal] = useState(false)
  const [fileToProcess, setFileToProcess] = useState(null)
  const [actionType, setActionType] = useState('move') // 'move' or 'copy'
  const [allFolders, setAllFolders] = useState([])
  const [selectedTargetFolder, setSelectedTargetFolder] = useState(null)
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverFolder, setDragOverFolder] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
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
  
  const openActionModal = (file, action) => {
    setFileToProcess(file)
    setActionType(action)
    setSelectedTargetFolder(null)
    setShowActionModal(true)
    setOpenMenuId(null)
    fetchAllFolders()
  }
  
  const processFile = async () => {
    if (!fileToProcess) return
    
    try {
      if (actionType === 'move') {
        // Move file
        const { error } = await supabase
          .from('files')
          .update({ folder_id: selectedTargetFolder })
          .eq('id', fileToProcess.id)
        
        if (error) throw error
      } else if (actionType === 'copy') {
        // Copy file - duplicate the database entry with new folder_id
        const { data: originalFile, error: fetchError } = await supabase
          .from('files')
          .select('*')
          .eq('id', fileToProcess.id)
          .single()
        
        if (fetchError) throw fetchError
        
        // Create new filename with copy suffix
        const timestamp = Date.now()
        const fileExt = originalFile.filename.split('.').pop()
        const baseName = originalFile.filename.replace(`.${fileExt}`, '')
        const newFileName = `${baseName} (Copy ${timestamp}).${fileExt}`
        
        // Copy the storage file
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('users')
          .download(originalFile.path)
        
        if (downloadError) throw downloadError
        
        // Upload to new path
        const newPath = `${user.id}/${timestamp}-${newFileName}`
        const { error: uploadError } = await supabase.storage
          .from('users')
          .upload(newPath, fileData)
        
        if (uploadError) throw uploadError
        
        // Insert new database record
        const { error: insertError } = await supabase
          .from('files')
          .insert([{
            user_id: user.id,
            path: newPath,
            filename: newFileName,
            size: originalFile.size,
            content_type: originalFile.content_type,
            folder_id: selectedTargetFolder
          }])
        
        if (insertError) throw insertError
      }
      
      setShowActionModal(false)
      setFileToProcess(null)
      setSelectedTargetFolder(null)
      fetchFiles()
    } catch (error) {
      console.error(`Error ${actionType}ing file:`, error.message)
      alert(`Failed to ${actionType} file: ` + error.message)
    }
  }
  
  const handleDragStart = (e, item, type) => {
    setDraggedItem({ ...item, type }) // type: 'file' or 'folder'
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleDragOver = (e, folderId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolder(folderId)
  }
  
  const handleDragLeave = () => {
    setDragOverFolder(null)
  }
  
  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault()
    setDragOverFolder(null)
    
    if (!draggedItem) return
    
    try {
      if (draggedItem.type === 'file') {
        const { error } = await supabase
          .from('files')
          .update({ folder_id: targetFolderId })
          .eq('id', draggedItem.id)
        
        if (error) throw error
      } else if (draggedItem.type === 'folder') {
        // Prevent dropping folder into itself or its children
        if (draggedItem.id === targetFolderId) return
        
        const { error } = await supabase
          .from('folders')
          .update({ parent_id: targetFolderId })
          .eq('id', draggedItem.id)
        
        if (error) throw error
      }
      
      fetchFiles()
    } catch (error) {
      console.error('Error in drag and drop:', error.message)
      alert('Failed to move item: ' + error.message)
    } finally {
      setDraggedItem(null)
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
      // Get current user session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('Please log in to download files')
        return
      }

      // Request signed URL from serverless function
      const response = await fetch(`/api/get-signed-url?fileId=${file.id}&token=${session.access_token}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate download link')
      }

      const { signedUrl, filename } = await response.json()

      // Create secure download link
      const a = document.createElement('a')
      a.href = signedUrl
      a.download = filename
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

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
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px',
        border: '1px solid #e0e7ff',
        overflow: 'hidden'
      }}>
        {/* Loading Header */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e0e7ff'
        }}>
          <div style={{
            height: '24px',
            backgroundColor: '#e2e8f0',
            borderRadius: '6px',
            width: '200px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        </div>
        
        {/* Loading Items */}
        {[...Array(5)].map((_, index) => (
          <div key={index} style={{
            padding: '1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#e2e8f0',
              borderRadius: '8px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                height: '16px',
                backgroundColor: '#e2e8f0',
                borderRadius: '4px',
                width: `${Math.random() * 40 + 40}%`,
                marginBottom: '8px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <div style={{
                height: '12px',
                backgroundColor: '#f1f5f9',
                borderRadius: '4px',
                width: `${Math.random() * 30 + 20}%`,
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            </div>
          </div>
        ))}
        
        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}
        </style>
      </div>
    )
  }

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px',
      border: '1px solid #e0e7ff',
      overflow: 'hidden',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      transition: 'all 0.2s ease-in-out'
    }}>
      {/* Search and Filter Header */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e0e7ff'
      }}>
        {/* Breadcrumbs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#64748b',
          fontWeight: '500'
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
          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '1rem' }}>
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
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s ease-in-out',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#9ef01a'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 8px 0 rgba(0, 0, 0, 0.12)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#A9FF00'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
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
                padding: '0.625rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                minWidth: '200px',
                maxWidth: '320px',
                outline: 'none',
                transition: 'all 0.2s ease-in-out',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                cursor: 'text',
                caretColor: '#3b82f6',
                lineHeight: '1.5'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = 'none'
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
          draggable
          onDragStart={(e) => handleDragStart(e, folder, 'folder')}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
          style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            backgroundColor: dragOverFolder === folder.id ? '#e8f5e8' : 'transparent',
            ':hover': { backgroundColor: '#f8f9fa' },
            position: 'relative'
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

          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(openMenuId === `folder-${folder.id}` ? null : `folder-${folder.id}`)
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#666',
                borderRadius: '4px'
              }}
            >
              ⋯
            </button>
            
            {openMenuId === `folder-${folder.id}` && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 100,
                minWidth: '120px'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteFolder(folder)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#ff4757'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Files */}
      {filteredFiles.map((file) => (
        <div
          key={file.id}
          draggable
          onDragStart={(e) => handleDragStart(e, file, 'file')}
          style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative'
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

          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <button
              onClick={() => setOpenMenuId(openMenuId === `file-${file.id}` ? null : `file-${file.id}`)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#666',
                borderRadius: '4px'
              }}
            >
              ⋯
            </button>
            
            {openMenuId === `file-${file.id}` && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 100,
                minWidth: '140px'
              }}>
                <button
                  onClick={() => downloadFile(file)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#333'
                  }}
                >
                  📥 Download
                </button>
                <button
                  onClick={() => openActionModal(file, 'move')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#3498db'
                  }}
                >
                  📁 Move
                </button>
                <button
                  onClick={() => openActionModal(file, 'copy')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#9b59b6'
                  }}
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => deleteFile(file)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#ff4757'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Action Modal (Move/Copy) */}
      {showActionModal && (
        <div 
          style={{
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
          }}
          onClick={() => {
            setShowActionModal(false)
            setFileToProcess(null)
            setSelectedTargetFolder(null)
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '2rem',
              minWidth: '400px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem 0' }}>
              {actionType === 'move' ? 'Move' : 'Copy'} File
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
              {actionType === 'move' ? 'Move' : 'Copy'} "{fileToProcess?.filename}" to a folder:
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
                onClick={() => setSelectedTargetFolder(null)}
                style={{
                  padding: '0.75rem',
                  cursor: 'pointer',
                  backgroundColor: selectedTargetFolder === null ? '#e3f2fd' : 'white',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>🏠</span>
                <span style={{ fontWeight: selectedTargetFolder === null ? 'bold' : 'normal' }}>
                  Home (Root)
                </span>
              </div>
              
              {/* Folder options */}
              {allFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setSelectedTargetFolder(folder.id)}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    backgroundColor: selectedTargetFolder === folder.id ? '#e3f2fd' : 'white',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>📁</span>
                  <div>
                    <div style={{ fontWeight: selectedTargetFolder === folder.id ? 'bold' : 'normal' }}>
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
                  setShowActionModal(false)
                  setFileToProcess(null)
                  setSelectedTargetFolder(null)
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
                onClick={processFile}
                style={{
                  backgroundColor: actionType === 'move' ? '#3498db' : '#9b59b6',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {actionType === 'move' ? 'Move' : 'Copy'} File
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside handler for menus */}
      {openMenuId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50
          }}
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  )
}