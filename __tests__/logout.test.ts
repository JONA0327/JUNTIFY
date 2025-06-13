const { POST } = require('../app/api/auth/logout/route')

describe('logout route', () => {
  it('clears the auth cookie', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toMatch(/auth_token/)
    expect(setCookie).toMatch(/Max-Age=0/)
  })
})
