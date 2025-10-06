import { PrismaClient, MessageRole, MessageType } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Clean existing data
  await prisma.fragment.deleteMany()
  await prisma.message.deleteMany()

  // Create sample messages
  const messages = await prisma.message.createMany({
    data: [
      {
        id: '1',
        role: MessageRole.USER,
        type: MessageType.RESULT,
        content: 'Hello, can you help me create a simple web application?',
      },
      {
        id: '2',
        role: MessageRole.ASSISTANT,
        type: MessageType.RESULT,
        content: 'Of course! I can help you create a web application. Let me start by creating some basic files.',
      },
      {
        id: '3',
        role: MessageRole.USER,
        type: MessageType.RESULT,
        content: 'Can you add some styling to make it look better?',
      },
      {
        id: '4',
        role: MessageRole.ASSISTANT,
        type: MessageType.RESULT,
        content: 'Absolutely! I\'ll add some modern CSS styling to improve the appearance.',
      },
    ],
  })

  // Create fragments for some messages
  const fragment1 = await prisma.fragment.create({
    data: {
      messageId: '2',
      sandboxUrl: 'https://sandbox.example.com/project1',
      title: 'Basic Web Application',
      files: {
        'index.html': {
          content: '<!DOCTYPE html><html><head><title>My App</title></head><body><h1>Hello World</h1></body></html>',
          type: 'html'
        },
        'style.css': {
          content: 'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }',
          type: 'css'
        }
      },
    },
  })

  const fragment2 = await prisma.fragment.create({
    data: {
      messageId: '4',
      sandboxUrl: 'https://sandbox.example.com/project1-styled',
      title: 'Styled Web Application',
      files: {
        'index.html': {
          content: '<!DOCTYPE html><html><head><title>My Styled App</title><link rel="stylesheet" href="style.css"></head><body><div class="container"><h1>Hello Beautiful World</h1><p>This is a styled web application.</p></div></body></html>',
          type: 'html'
        },
        'style.css': {
          content: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; } .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; text-align: center; } h1 { font-size: 3rem; margin-bottom: 20px; } p { font-size: 1.2rem; opacity: 0.9; }',
          type: 'css'
        }
      },
    },
  })

  console.log('Database seeding completed!')
  console.log(`Created ${messages.count} messages`)
  console.log(`Created 2 fragments`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })