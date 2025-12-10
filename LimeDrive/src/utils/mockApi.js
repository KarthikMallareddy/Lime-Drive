// Mock API for local development - simulates serverless functions
// This file is only used during development when APIs are not available

const generateShareToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// In-memory store for shares (reset on page refresh)
let mockShares = {}

export const mockApiHandler = async (endpoint, options = {}) => {
  const { method = 'POST', body } = options

  // CREATE SHARE
  if (endpoint === '/api/create-share') {
    try {
      const data = JSON.parse(body)
      const shareToken = generateShareToken()
      
      // Get the correct origin (works for localhost AND production)
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
      
      const share = {
        id: Math.random().toString(36).substr(2, 9),
        token: shareToken,
        url: `${origin}/share/${shareToken}`,
        shareType: data.shareType || 'public',
        permissions: data.permissions || 'download',
        isActive: true,
        createdAt: new Date().toISOString()
      }

      mockShares[shareToken] = {
        ...share,
        fileId: data.fileId,
        folderId: data.folderId,
        ownerId: 'mock-user-id',
        viewCount: 0
      }

      console.log('📤 Share created with URL:', share.url)
      return new Response(JSON.stringify({ share }), { status: 201 })
    } catch (error) {
      console.error('❌ Share creation error:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
  }

  // VALIDATE SHARE
  if (endpoint.startsWith('/api/validate-share')) {
    const url = new URL(endpoint, window.location.origin)
    const token = url.searchParams.get('token')
    
    if (!token || !mockShares[token]) {
      return new Response(JSON.stringify({ error: 'Share not found' }), { status: 404 })
    }

    const share = mockShares[token]
    share.viewCount = (share.viewCount || 0) + 1

    const responseData = {
      share: {
        id: share.id,
        token: share.token,
        shareType: share.shareType,
        permissions: share.permissions,
        viewCount: share.viewCount,
        downloadCount: 0,
        createdAt: share.createdAt,
        expiresAt: null
      }
    }

    // Mock file data
    if (share.fileId) {
      responseData.file = {
        id: share.fileId,
        filename: 'sample-document.pdf',
        size: 1024 * 500, // 500 KB
        contentType: 'application/pdf',
        path: 'users/mock-user-id/files/sample.pdf'
      }
    }

    if (share.folderId) {
      responseData.folder = {
        id: share.folderId,
        name: 'Sample Folder'
      }
    }

    return new Response(JSON.stringify(responseData), { status: 200 })
  }

  // GET SIGNED URL
  if (endpoint === '/api/get-signed-url') {
    try {
      const data = JSON.parse(body)
      // Mock a signed URL
      const signedUrl = `https://storage.example.com/file?token=${Math.random().toString(36).substr(2, 9)}&expires=3600`
      
      return new Response(JSON.stringify({ signedUrl }), { status: 200 })
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
  }

  return new Response(JSON.stringify({ error: 'Unknown endpoint' }), { status: 404 })
}

export default mockApiHandler
