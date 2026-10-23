
const request = require('supertest')
const app = require('../app')

describe('Smart Adaptive Learning API', () => {
  test('GET / should return the API status', async () => {
    const response = await request(app).get('/')

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      message: 'Smart Adaptive Learning API is running!'
    })
  })

  test('GET /test-questions should return a test message', async () => {
    const response = await request(app).get('/test-questions')

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      message: 'Question test route works!'
    })
  })

  test('Unknown routes should return 404', async () => {
    const response = await request(app).get('/unknown-route')

    expect(response.statusCode).toBe(404)
    expect(response.body.message).toBe('Route not found')
  })

  test('API should return JSON responses', async () => {
    const response = await request(app).get('/')

    expect(response.headers['content-type']).toMatch(/application\/json/)
  })
})
