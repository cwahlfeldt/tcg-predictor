import predictCard from './predictions/guess-card.js'
import Fastify from 'fastify'
const fastify = Fastify({
  logger: true
})

// Declare a route
fastify.get('/', async function handler(request, reply) {
  const card = await predictCard('https://images.pokemontcg.io/dp3/1_hires.png')
  return card
})

// Run the server!
try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}