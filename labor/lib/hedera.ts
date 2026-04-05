import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
  PrivateKey,
  AccountId,
} from '@hashgraph/sdk'

let client: Client | null = null

export function initHederaClient() {
  if (client) return client

  const accountId = process.env.HEDERA_ACCOUNT_ID || '0.0.0'
  const privateKey = process.env.HEDERA_PRIVATE_KEY || ''
  const network = (process.env.HEDERA_NETWORK || 'testnet') as 'testnet' | 'mainnet'

  if (!accountId || !privateKey) {
    throw new Error('Hedera credentials not configured in .env.local')
  }

  console.log(`[Hedera] Initializing client for ${network} with account ${accountId}`)

  client =
    network === 'mainnet'
      ? Client.forMainnet()
      : Client.forTestnet()

  try {
    client.setOperator(AccountId.fromString(accountId), PrivateKey.fromString(privateKey))
  } catch (err) {
    console.error('[Hedera] Failed to set operator:', err)
    throw err
  }

  return client
}

export interface CheckInPayload {
  workerId: string
  jobId: string
  timestamp: number
  type: 'checkin' | 'checkout'
  location?: string
}

export interface HCSMessage {
  sequenceNumber: number
  timestamp: Date
  payload: CheckInPayload
  transactionId: string
  hashscanUrl: string
}

/**
 * Create a new Hedera Consensus Service topic for a job
 */
export async function createJobTopic(jobId: string): Promise<string> {
  const hederaClient = initHederaClient()

  console.log(`[Hedera] Creating topic for job ${jobId}`)

  try {
    const createTopicTx = new TopicCreateTransaction().setTopicMemo(`LaborLink Job ${jobId}`)

    const submitTx = await createTopicTx.execute(hederaClient)
    const receipt = await submitTx.getReceipt(hederaClient)

    const topicId = receipt.topicId?.toString() || ''
    console.log(`[Hedera] Topic created: ${topicId}`)

    return topicId
  } catch (err) {
    console.error('[Hedera] Topic creation failed:', err)
    throw err
  }
}

/**
 * Submit a check-in or check-out message to a job's HCS topic
 */
export async function submitCheckIn(
  topicId: string,
  payload: CheckInPayload
): Promise<{ sequenceNumber: number; transactionId: string; hashscanUrl: string }> {
  const hederaClient = initHederaClient()

  console.log(
    `[Hedera] Submitting ${payload.type} message to topic ${topicId} for worker ${payload.workerId}`
  )

  try {
    const messageJson = JSON.stringify(payload)
    const submitTx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(messageJson)

    const response = await submitTx.execute(hederaClient)
    const receipt = await response.getReceipt(hederaClient)

    const txId = response.transactionId.toString()
    const hashscanUrl = `https://hashscan.io/testnet/transaction/${txId}`

    console.log(`[Hedera] Message submitted: url=${hashscanUrl}`)

    return {
      sequenceNumber: 1, // Simplified - real implementation would extract from HCS message
      transactionId: txId,
      hashscanUrl,
    }
  } catch (err) {
    console.error('[Hedera] Message submission failed:', err)
    throw err
  }
}

/**
 * Query all messages from a job's HCS topic
 * Note: For hackathon, returns demo data. Production uses TopicMessageQuery
 */
export async function getJobMessages(topicId: string): Promise<HCSMessage[]> {
  console.log(`[Hedera] Querying messages for topic ${topicId}`)

  // Mock implementation for hackathon
  // In production: use TopicMessageQuery with Hedera SDK
  const demoMessages: HCSMessage[] = [
    {
      sequenceNumber: 1,
      timestamp: new Date(Date.now() - 3600000),
      payload: {
        workerId: '0xworker',
        jobId: 'demo_job',
        timestamp: Date.now() - 3600000,
        type: 'checkin',
        location: 'Job Site',
      },
      transactionId: '0.0.1@1700000000.0',
      hashscanUrl: `https://hashscan.io/testnet/topic/${topicId}`,
    },
    {
      sequenceNumber: 2,
      timestamp: new Date(Date.now() - 1800000),
      payload: {
        workerId: '0xworker',
        jobId: 'demo_job',
        timestamp: Date.now() - 1800000,
        type: 'checkout',
        location: 'Job Site',
      },
      transactionId: '0.0.2@1700001800.0',
      hashscanUrl: `https://hashscan.io/testnet/topic/${topicId}`,
    },
  ]

  console.log(`[Hedera] Retrieved ${demoMessages.length} messages from topic`)
  return demoMessages
}
