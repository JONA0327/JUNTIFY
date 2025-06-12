jest.mock('../utils/mysql', () => ({
  query: jest.fn().mockResolvedValue(null)
}))

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid')
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async () => 'hashed')
}))

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader() { return this },
    setExpirationTime() { return this },
    sign: jest.fn(async () => 'signed-token')
  }))
}))

const { POST } = require('../app/api/auth/register/route')

describe('register route', () => {
  it('inserts all fields and returns user info', async () => {
    process.env.JWT_SECRET = 'secret'
    const body = {
      username: 'testuser',
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'pass'
    }

    const req = { json: async () => body } as unknown as Request
    const res = await POST(req)

    const query = require('../utils/mysql').query as jest.Mock

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      [
        'test-uuid',
        body.username,
        body.full_name,
        body.email,
        'hashed',
        'free',
        null
      ]
    )

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.user).toMatchObject({
      id: 'test-uuid',
      username: body.username,
      full_name: body.full_name,
      email: body.email,
      roles: 'free',
      organization: null
    })
    expect(typeof data.token).toBe('string')
    expect(data.token.length).toBeGreaterThan(0)
  })
})
