import { createClient } from '@supabase/supabase-js'

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

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token } = req.query

    if (!token) {
      return res.status(400).json({ error: 'Share token is required' })
    }

    // Get share data with file/folder information
    const { data: shareData, error: shareError } = await supabase
      .from('shares')
      .select(`
        *,
        files (id, filename, size, content_type, path),
        folders (id, name)
      `)
      .eq('share_token', token)
      .eq('is_active', true)
      .single()

    if (shareError || !shareData) {
      return res.status(404).json({ error: 'Share not found or has been disabled' })
    }

    // Check if share has expired
    if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Share has expired' })
    }

    // Increment view count
    try {
      await supabase
        .from('shares')
        .update({ view_count: shareData.view_count + 1 })
        .eq('id', shareData.id)
    } catch (updateError) {
      console.warn('Failed to update view count:', updateError)
    }

    // Prepare response data
    const responseData = {
      share: {
        id: shareData.id,
        token: shareData.share_token,
        shareType: shareData.share_type,
        permissions: shareData.permissions,
        viewCount: shareData.view_count + 1,
        downloadCount: shareData.download_count,
        createdAt: shareData.created_at,
        expiresAt: shareData.expires_at
      }
    }

    // Add file or folder information
    if (shareData.file_id && shareData.files) {
      responseData.file = {
        id: shareData.files.id,
        filename: shareData.files.filename,
        size: shareData.files.size,
        contentType: shareData.files.content_type,
        path: shareData.files.path
      }
    }

    if (shareData.folder_id && shareData.folders) {
      responseData.folder = {
        id: shareData.folders.id,
        name: shareData.folders.name
      }
    }

    return res.status(200).json(responseData)

  } catch (error) {
    console.error('Validate share error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}