import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Generate a secure random token for the share
function generateShareToken() {
  return randomBytes(32).toString('hex')
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fileId, folderId, shareType = 'public', permissions = 'download', token } = req.body

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' })
    }

    if (!fileId && !folderId) {
      return res.status(400).json({ error: 'Either fileId or folderId is required' })
    }

    if (fileId && folderId) {
      return res.status(400).json({ error: 'Cannot share both file and folder simultaneously' })
    }

    // Verify the user's authentication token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' })
    }

    // Verify user owns the file/folder
    if (fileId) {
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('id, filename, user_id')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single()

      if (fileError || !fileData) {
        return res.status(404).json({ error: 'File not found or access denied' })
      }
    }

    if (folderId) {
      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .select('id, name, user_id')
        .eq('id', folderId)
        .eq('user_id', user.id)
        .single()

      if (folderError || !folderData) {
        return res.status(404).json({ error: 'Folder not found or access denied' })
      }
    }

    // Generate unique share token
    const shareToken = generateShareToken()

    // Create the share record
    const { data: shareData, error: shareError } = await supabase
      .from('shares')
      .insert([{
        file_id: fileId || null,
        folder_id: folderId || null,
        owner_id: user.id,
        share_token: shareToken,
        share_type: shareType,
        permissions: permissions,
        is_active: true
      }])
      .select('*')
      .single()

    if (shareError) {
      console.error('Share creation error:', shareError)
      return res.status(500).json({ error: 'Failed to create share' })
    }

    // Generate the public share URL
    const shareUrl = `${req.headers.origin || 'http://localhost:3000'}/share/${shareToken}`

    // Return the share data
    return res.status(201).json({
      share: {
        id: shareData.id,
        token: shareData.share_token,
        url: shareUrl,
        shareType: shareData.share_type,
        permissions: shareData.permissions,
        isActive: shareData.is_active,
        createdAt: shareData.created_at
      },
      message: 'Share created successfully'
    })

  } catch (error) {
    console.error('Create share error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}