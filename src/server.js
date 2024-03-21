import predictCard from './predictions/predictCard.js'
import Fastify from 'fastify'
const fastify = Fastify({
  logger: true
})

// Declare a route
fastify.get('/', async function handler(request, reply) {
  const card = await predictCard('https://u-mercari-images.mercdn.net/photos/m33845532074_1.jpg?width=1024&height=1024&format=pjpg&auto=webp&fit=crop&_=1693686958')
  return card
})

// Run the server!
try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}