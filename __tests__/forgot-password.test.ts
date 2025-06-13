jest.mock('../utils/mysql', () => ({
  queryOne: jest.fn(),
  query: jest.fn(),
}))

jest.mock('../utils/email', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}))

const { POST } = require('../app/api/auth/forgot-password/route')

describe('forgot password route', () => {
  it('sends reset email when user exists', async () => {
    const { queryOne } = require('../utils/mysql') as { queryOne: jest.Mock }
    queryOne.mockResolvedValue({ id: 'user-id' })

    const body = { email: 'test@example.com' }
    const req = { json: async () => body } as unknown as Request
    const res = await POST(req)

    expect(res.status).toBe(200)
    const { sendPasswordResetEmail } = require('../utils/email')
    expect(sendPasswordResetEmail).toHaveBeenCalled()
  })
})
