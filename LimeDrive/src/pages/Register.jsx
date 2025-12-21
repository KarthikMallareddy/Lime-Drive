import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { data, error } = await signUp(email, password)

    if (error) {
      setError(error.message)
    } else {
      if (data?.user && !data.session) {
        setMessage('Check your email for confirmation link!')
      } else {
        navigate('/dashboard')
      }
    }

    setLoading(false)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Left side - Branding */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem',
        color: 'white'
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, #A9FF00 0%, #7fc700 100%)',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
          boxShadow: '0 20px 60px rgba(169, 255, 0, 0.3)'
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3V16M12 16L16 11.625M12 16L8 11.625" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '800',
          margin: '0 0 1rem 0',
          letterSpacing: '-0.02em'
        }}>LimeDrive</h1>
        <p style={{
          fontSize: '1.25rem',
          color: '#94a3b8',
          margin: 0,
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          Join thousands of users storing their files securely in the cloud.
        </p>
      </div>

      {/* Right side - Form */}
      <div style={{
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem'
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#A9FF00',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 25px rgba(169, 255, 0, 0.3)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ 
            color: '#1e293b', 
            margin: '0 0 0.5rem 0',
            fontSize: '2.25rem',
            fontWeight: '800',
            letterSpacing: '-0.025em'
          }}>
            Create Account
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: '1rem',
            margin: 0
          }}>
            Join Lime Drive today
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              color: '#1e293b',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease-in-out',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontWeight: '500'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#A9FF00'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = '0 0 0 3px rgba(169, 255, 0, 0.15)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              color: '#1e293b',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease-in-out',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontWeight: '500'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#A9FF00'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = '0 0 0 3px rgba(169, 255, 0, 0.15)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              color: '#1e293b',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease-in-out',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontWeight: '500'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#A9FF00'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = '0 0 0 3px rgba(169, 255, 0, 0.15)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1rem' }}>✅</span>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9ca3af' : '#A9FF00',
              color: '#000',
              border: 'none',
              padding: '1rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(169, 255, 0, 0.3)',
              letterSpacing: '0.025em'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#98E600'
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(169, 255, 0, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#A9FF00'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(169, 255, 0, 0.3)'
              }
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ 
          textAlign: 'center', 
          marginTop: '0',
          marginBottom: '0',
          color: '#64748b',
          fontSize: '0.875rem'
        }}>
          Already have an account?{' '}
          <Link 
            to="/login"
            style={{ 
              color: '#A9FF00',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'color 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#98E600'
              e.target.style.textDecoration = 'underline'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#A9FF00'
              e.target.style.textDecoration = 'none'
            }}
          >
            Sign In
          </Link>
        </p>
        </div>
      </div>
    </div>
  )
}