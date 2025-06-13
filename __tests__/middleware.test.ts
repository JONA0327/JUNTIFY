jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}))

import { jwtVerify } from 'jose'
import { middleware } from '../middleware'
import { NextRequest } from 'next/server'

describe('middleware', () => {
  beforeEach(() => {
    ;(jwtVerify as jest.Mock).mockReset()
  })

  it('blocks requests without token', async () => {
    const req = new NextRequest('http://localhost/api/containers')
    const res = await middleware(req)
    expect(res.status).toBe(401)
  })

  it('blocks requests with invalid token', async () => {
    ;(jwtVerify as jest.Mock).mockRejectedValue(new Error('invalid'))
    const req = new NextRequest('http://localhost/api/containers', {
      headers: { cookie: 'auth_token=bad' },
    })
    const res = await middleware(req)
    expect(res.status).toBe(401)
  })

  it('injects username for valid token', async () => {
    ;(jwtVerify as jest.Mock).mockResolvedValue({ payload: { username: 'alice' } })
    const req = new NextRequest('http://localhost/api/containers', {
      headers: { cookie: 'auth_token=good' },
    })
    const res = await middleware(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('x-middleware-request-x-username')).toBe('alice')
  })

  it('redirects to login for protected page without token', async () => {
    const req = new NextRequest('http://localhost/dashboard')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/login')
  })

  it('allows protected page with valid token', async () => {
    ;(jwtVerify as jest.Mock).mockResolvedValue({ payload: { username: 'alice' } })
    const req = new NextRequest('http://localhost/dashboard', {
      headers: { cookie: 'auth_token=good' },
    })
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })
})
