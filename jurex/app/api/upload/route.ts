import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const metadataStr = formData.get("metadata") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Parse metadata if provided
    let metadata: { name?: string; keyvalues?: Record<string, string> } = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr) as { name?: string; keyvalues?: Record<string, string> };
      } catch {
        console.warn("[Upload] Failed to parse metadata");
      }
    }

    // Create Pinata form data
    const pinataFormData = new FormData();
    pinataFormData.append("file", file);
    pinataFormData.append(
      "pinataMetadata",
      JSON.stringify({
        name: metadata.name || file.name || `evidence-${Date.now()}`,
        keyvalues: {
          type: "evidence",
          timestamp: Date.now().toString(),
          ...metadata.keyvalues,
        },
      })
    );

    // Upload to Pinata via REST API
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinata upload failed: ${error}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ipfsHash: data.IpfsHash,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      pinSize: data.PinSize,
      timestamp: data.Timestamp,
    });
  } catch (error) {
    console.error("[Upload API] Error:", error);
    return NextResponse.json(
      { error: "Upload failed", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { hash } = await request.json();

    if (!hash) {
      return NextResponse.json(
        { error: "No hash provided" },
        { status: 400 }
      );
    }

    // Unpin from Pinata
    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${hash}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to unpin from Pinata");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Unpin API] Error:", error);
    return NextResponse.json(
      { error: "Unpin failed", message: (error as Error).message },
      { status: 500 }
    );
  }
}
