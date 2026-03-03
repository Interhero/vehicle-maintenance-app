"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import React from 'react';

export default function MigratePage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleMigrate = async () => {
        if (!session || !session.accessToken) {
            alert("Not logged in or missing access token!");
            return;
        }

        setLoading(true);
        setResult("Migrating...");

        try {
            const res = await fetch("/api/admin/migrate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({
                    sourceId: "1RA3-36TzHqmncT0420k3hsjmbJ59grwt58UG3oN7Bqg",
                    targetId: "19P34NYnhEkRg6_tjvD0lVTH9gmqZr1XhzOLHSGUe5Og"
                }),
            });

            const data = await res.json();
            setResult(JSON.stringify(data, null, 2));
        } catch (e: any) {
            setResult("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") return <div className="p-10">Loading auth...</div>;
    if (status === "unauthenticated") return <div className="p-10">Please log in to the main dashboard first.</div>;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-10 flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-6">Database Migration Tool</h1>
            <p className="mb-8 text-zinc-400 max-w-lg text-center">
                This tool will authenticate via your active Google session, securely read the legacy 28-column format from your original spreadsheet, and translate/inject it into the new 15-column gapless layout.
            </p>

            <button
                onClick={handleMigrate}
                disabled={loading}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl transition-all disabled:opacity-50"
            >
                {loading ? "Migrating Data..." : "Execute Migration"}
            </button>

            {result && (
                <pre className="mt-10 bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-sm font-mono max-w-2xl w-full overflow-auto">
                    {result}
                </pre>
            )}
        </div>
    );
}
