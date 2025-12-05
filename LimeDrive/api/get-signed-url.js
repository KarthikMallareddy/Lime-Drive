import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Server-side key

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
  // Allow both GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let fileId, token, shareToken, filePath

    if (req.method === 'GET') {
      ({ fileId, token } = req.query)
    } else {
      ({ fileId, token, shareToken, filePath } = req.body)
    }

    // Handle share token authentication
    if (shareToken && filePath) {
      // Validate share token and get file access
      const { data: shareData, error: shareError } = await supabase
        .from('shares')
        .select(`
          *,
          files!inner(*)
        `)
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single()

      if (shareError || !shareData) {
        return res.status(404).json({ error: 'Share not found or expired' })
      }

      // Check if share has expired
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        return res.status(403).json({ error: 'Share has expired' })
      }

      // Check permissions
      if (shareData.permissions !== 'download') {
        return res.status(403).json({ error: 'Download not permitted for this share' })
      }

      // Use the file from the share
      const fileData = shareData.files

      // Generate signed URL (expires in 1 hour)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('users')
        .createSignedUrl(filePath, 3600, {
          download: true
        })

      if (urlError) {
        console.error('Signed URL generation error:', urlError)
        return res.status(500).json({ error: 'Failed to generate download URL' })
      }

      return res.status(200).json({ 
        signedUrl: signedUrlData.signedUrl,
        filename: fileData.filename
      })
    }

    // Handle regular authenticated user access
    if (!fileId || !token) {
      return res.status(400).json({ error: 'Missing fileId or authentication token' })
    }

    // Verify the user's authentication token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' })
    }

    // Get file metadata from database
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id) // Ensure user owns the file
      .single()

    if (fileError || !fileData) {
      return res.status(404).json({ error: 'File not found or access denied' })
    }

    // Generate signed URL (expires in 1 hour)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('users')
      .createSignedUrl(fileData.path, 3600, {
        download: true,
        transform: {
          width: null,
          height: null
        }
      })

    if (urlError) {
      console.error('Signed URL generation error:', urlError)
      return res.status(500).json({ error: 'Failed to generate download URL' })
    }

    // Optional: Log download for analytics
    try {
      await supabase
        .from('download_logs')
        .insert([{
          file_id: fileId,
          user_id: user.id,
          downloaded_at: new Date().toISOString(),
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent']
        }])
    } catch (logError) {
      // Don't fail the request if logging fails
      console.warn('Download logging failed:', logError)
    }

    // Return the signed URL with metadata
    return res.status(200).json({
      signedUrl: signedUrlData.signedUrl,
      filename: fileData.filename,
      size: fileData.size,
      contentType: fileData.content_type,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
    })

  } catch (error) {
    console.error('Serverless function error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}