jest.mock('../utils/mysql', () => ({
  queryOne: jest.fn()
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(async () => true)
}))

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader() { return this },
    setExpirationTime() { return this },
    sign: jest.fn(async () => 'signed-token')
  }))
}))

const { POST } = require('../app/api/auth/login/route')

const mockUser = {
  id: 'user-id',
  username: 'testuser',
  full_name: 'Test User',
  email: 'test@example.com',
  password: 'hashed',
  roles: 'free',
  organization: null
}

describe('login route', () => {
  it('returns token and user info', async () => {
    process.env.JWT_SECRET = 'secret'
    const queryOne = require('../utils/mysql').queryOne as jest.Mock
    queryOne.mockResolvedValue(mockUser)

    const body = { email: 'test@example.com', password: 'pass' }
    const req = { json: async () => body } as unknown as Request

    const res = await POST(req)

    expect(queryOne).toHaveBeenCalledWith(
      expect.stringContaining('WHERE email = ?'),
      [body.email]
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.user).toMatchObject({
      id: mockUser.id,
      username: mockUser.username,
      full_name: mockUser.full_name,
      email: mockUser.email,
      roles: mockUser.roles,
      organization: mockUser.organization
    })
    expect(typeof data.token).toBe('string')
    expect(data.token.length).toBeGreaterThan(0)
  })
})
