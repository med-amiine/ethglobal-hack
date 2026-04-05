"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/app/components/Navbar";
import { TerminalCard } from "@/app/components/ui/TerminalCard";

export default function ApiDocsPage() {
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/docs")
      .then((res) => res.json())
      .then((data) => {
        setSchema(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20 pb-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-[#8899AA]">Loading API docs...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-[#C9A84C] mb-2 font-serif">
            API Documentation
          </h1>
          <p className="text-[#8899AA] mb-8">
            OpenAPI schema for Jurex v2
          </p>

          {/* Swagger UI Link */}
          <div className="mb-8">
            <a
              href="https://editor.swagger.io/?url=http://localhost:3000/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-[#C9A84C] text-black font-mono text-sm rounded hover:bg-[#a8823a] transition-colors"
            >
              Open in Swagger UI →
            </a>
          </div>

          {/* Endpoints List */}
          <div className="space-y-4">
            {schema?.paths &&
              Object.entries(schema.paths).map(([path, methods]: [string, any]) => (
                <TerminalCard key={path} title={path}>
                  <div className="space-y-3">
                    {Object.entries(methods).map(([method, details]: [string, any]) => (
                      <div key={method}>
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-2 py-1 text-xs font-mono font-bold rounded ${
                              method === "get"
                                ? "bg-[#4ade80] text-black"
                                : method === "post"
                                ? "bg-[#C9A84C] text-black"
                                : "bg-[#ff3366] text-white"
                            }`}
                          >
                            {method.toUpperCase()}
                          </span>
                          <span className="text-[#8899AA]">{details.summary}</span>
                        </div>

                        {details.parameters && details.parameters.length > 0 && (
                          <div className="ml-4 text-sm text-[#4A5568] mb-2">
                            <div className="font-mono text-xs mb-1">Parameters:</div>
                            {details.parameters.map((param: any) => (
                              <div key={param.name}>
                                {param.name} ({param.schema?.type || "string"})
                              </div>
                            ))}
                          </div>
                        )}

                        {details.requestBody && (
                          <div className="ml-4 text-sm text-[#4A5568]">
                            <div className="font-mono text-xs">Request Body:</div>
                            <pre className="text-[10px] bg-[#050505] p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(
                                details.requestBody.content["application/json"]
                                  .schema.properties,
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TerminalCard>
              ))}
          </div>

          {/* Raw JSON */}
          <TerminalCard title="Raw OpenAPI Schema" className="mt-8">
            <pre className="text-[10px] text-[#8899AA] overflow-auto max-h-96 bg-[#050505] p-4 rounded">
              {JSON.stringify(schema, null, 2)}
            </pre>
          </TerminalCard>
        </div>
      </div>
    </>
  );
}
