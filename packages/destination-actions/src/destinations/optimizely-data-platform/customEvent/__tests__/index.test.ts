import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

let testDestination = createTestIntegration(Destination)

describe('OptimizelyDataPlatform.trackEvent', () => {
  beforeEach((done) => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
    done()
  })
  describe('perform', () => {
    const productEvent = createTestEvent({
      type: 'track',
      event: 'purchase',
      context: {
        traits: {
          email: 'test.email@test.com'
        }
      },
      properties: {
        order_id: '1234',
        total: 20,
        products: [
          { product_id: '12345', quantity: 2 },
          { product_id: '67890', quantity: 5 }
        ]
      }
    })

    const requestData = {
      event: productEvent,
      settings: {
        apiKey: 'abc123',
        region: 'US'
      },
      mapping: {
        user_identifiers: {
          anonymousId: 'anonId1234',
          userId: 'user1234'
        },
        event_type: 'whatever',
        event_action: 'purchase',
        products: [
          { product_id: '12345', qty: 2 },
          { product_id: '67890', qty: 5 }
        ],
        order_id: '1234',
        total: 20,
        timestamp: '2024-03-01T18:11:27.649Z'
      }
    }

    it('Should fire custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201)

      const response = await testDestination.testAction('customEvent', requestData)

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchSnapshot()
    })

    it('Should fail if missing required field', async () => {
      const missingData = createTestEvent({
        type: 'track',
        event: 'purchase',
        context: {
          traits: {
            email: 'test.email@test.com'
          }
        },
        properties: {
          total: 20,
          products: [
            { product_id: '12345', quantity: 2 },
            { product_id: '67890', quantity: 5 }
          ]
        }
      })
      const badData = {
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        useDefaultMappings: true,
        event: missingData
      }

      await expect(testDestination.testAction('customEvent', badData)).rejects.toThrowError(
        "The root value is missing the required field 'event_action'."
      )
    })

    it('Should handle 400 error (bad body)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(400)

      await expect(testDestination.testAction('customEvent', requestData)).rejects.toThrowError()
    })

    it('Should handle 401 error (no auth)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(401)

      await expect(testDestination.testAction('customEvent', requestData)).rejects.toThrowError()
    })

    it('Should handle 429 error (rate limit)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(429)

      await expect(testDestination.testAction('customEvent', requestData)).rejects.toThrowError()
    })
  })

  describe('performBatch', () => {
    const productEvents = [
      createTestEvent({
        type: 'track',
        event: 'purchase',
        context: {
          traits: {
            email: 'test.email@test.com'
          }
        },
        properties: {
          order_id: '1234',
          total: 20,
          products: [
            { product_id: '12345', quantity: 2 },
            { product_id: '67890', quantity: 5 }
          ]
        }
      }),
      createTestEvent({
        type: 'track',
        event: 'purchase',
        context: {
          traits: {
            email: 'test.email1@test.com'
          }
        },
        properties: {
          order_id: '6789',
          total: 20,
          products: [
            { product_id: '6789', quantity: 2 },
            { product_id: '10243', quantity: 5 }
          ]
        }
      })
    ]

    const requestData = {
      events: productEvents,
      settings: {
        apiKey: 'abc123',
        region: 'US'
      },
      mapping: {
        user_identifiers: {
          anonymousId: 'anonId1234',
          userId: 'user1234'
        },
        event_type: 'whatever',
        event_action: 'purchase',
        products: [
          { product_id: '12345', qty: 2 },
          { product_id: '67890', qty: 5 }
        ],
        order_id: '1234',
        total: 20,
        timestamp: '2024-03-01T18:11:27.649Z'
      }
    }

    it('Should fire custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(201)

      const response = await testDestination.testBatchAction('customEvent', requestData)

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchSnapshot()
    })

    it('Should return empty array if missing required field', async () => {
      const badData = {
        events: productEvents,
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        useDefaultMappings: true
      }

      await expect(testDestination.testBatchAction('customEvent', badData)).resolves.toEqual([])
    })

    it('Should handle 400 error (bad body)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(400)

      await expect(testDestination.testBatchAction('customEvent', requestData)).rejects.toThrowError()
    })

    it('Should handle 401 error (no auth)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(401)

      await expect(testDestination.testBatchAction('customEvent', requestData)).rejects.toThrowError()
    })

    it('Should handle 429 error (rate limit)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_custom_event').reply(429)

      await expect(testDestination.testBatchAction('customEvent', requestData)).rejects.toThrowError()
    })
  })
})
