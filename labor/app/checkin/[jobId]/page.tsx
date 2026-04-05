'use client'

import { CheckInQR } from '@/app/components/CheckInQR'
import { useParams } from 'next/navigation'

export default function CheckInPage() {
  const params = useParams()
  const jobId = params.jobId as string

  // Demo values - in production, fetch from job registry
  const topicId = 'demo_topic_123'
  const employerAddress = '0xdemo_employer_address'

  return (
    <CheckInQR jobId={jobId} topicId={topicId} employerAddress={employerAddress} />
  )
}
