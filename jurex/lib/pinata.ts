/**
 * Pinata IPFS Integration
 * Uses Pinata REST API for file uploads
 */

const PINATA_JWT = process.env.PINATA_JWT || "";
const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_UNPIN_URL = "https://api.pinata.cloud/pinning/unpin";

/**
 * Upload a file to IPFS via Pinata
 * @param file - File to upload (Blob, File, or Buffer)
 * @param metadata - Optional metadata for the file
 * @returns IPFS hash (CID) and gateway URL
 */
export async function uploadToPinata(
  file: File | Blob,
  metadata?: {
    name?: string;
    description?: string;
    keyvalues?: Record<string, string>;
  }
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name: metadata?.name || `evidence-${Date.now()}`,
      keyvalues: {
        type: "evidence",
        timestamp: Date.now().toString(),
        ...metadata?.keyvalues,
      },
    })
  );

  const response = await fetch(PINATA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata upload failed: ${error}`);
  }

  const result = await response.json();

  return {
    ipfsHash: result.IpfsHash,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    pinSize: result.PinSize,
    timestamp: result.Timestamp,
  };
}

/**
 * Upload JSON metadata to IPFS
 * @param data - JSON object to upload
 * @param name - Name for the file
 * @returns IPFS hash and gateway URL
 */
export async function uploadJSONToPinata(
  data: Record<string, unknown>,
  name: string
) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const file = new File([blob], `${name}.json`, {
    type: "application/json",
  });

  return uploadToPinata(file, {
    name,
    keyvalues: {
      type: "metadata",
      timestamp: Date.now().toString(),
    },
  });
}

/**
 * Unpin a file from Pinata
 * @param hash - IPFS hash to unpin
 */
export async function unpinFromPinata(hash: string) {
  const response = await fetch(`${PINATA_UNPIN_URL}/${hash}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to unpin from Pinata");
  }

  return { success: true };
}

/**
 * List pinned files with optional filters
 * Note: Uses Pinata Pin List API
 */
export async function listPinnedFiles(
  filters?: {
    name?: string;
    keyvalues?: Record<string, string>;
  }
) {
  const params = new URLSearchParams();
  if (filters?.name) {
    params.append("metadata[name]", filters.name);
  }

  const response = await fetch(
    `https://api.pinata.cloud/data/pinList?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to list pinned files");
  }

  return response.json();
}
