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
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fileId, token } = req.query

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