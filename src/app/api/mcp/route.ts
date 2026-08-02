import { createMcpHandler } from "mcp-handler";
import { kv } from "@vercel/kv";
import { fetchVehicles, fetchMaintenanceRecords } from "@/lib/googleSheets";
import { z } from "zod";

const handler = createMcpHandler((server) => {
    // 1. Reminders (from KV cache) - completely open
    server.registerTool(
        "get_tax_insurance_reminders",
        {
            description: "Get road tax and insurance reminders for all vehicles stored in the system cache. No authentication required.",
            inputSchema: z.object({})
        },
        async () => {
            try {
                const keys = await kv.keys("push_expiries:*");
                const allAlerts: any[] = [];
                const now = new Date();

                for (const key of keys) {
                    const email = key.replace("push_expiries:", "");
                    const vehicles = await kv.get<any[]>(key) || [];
                    
                    vehicles.forEach(v => {
                        const rDate = new Date(v.roadtaxExpiry);
                        const iDate = new Date(v.insuranceExpiry);
                        
                        let roadTaxStatus = "Valid";
                        if (v.roadtaxExpiry && !isNaN(rDate.getTime())) {
                            const diff = (rDate.getTime() - now.getTime()) / 86400000;
                            if (diff <= 14 && diff >= 0) roadTaxStatus = `Expires in ${Math.ceil(diff)} days`;
                            else if (diff < 0) roadTaxStatus = "Overdue";
                        }

                        let insuranceStatus = "Valid";
                        if (v.insuranceExpiry && !isNaN(iDate.getTime())) {
                            const diff = (iDate.getTime() - now.getTime()) / 86400000;
                            if (diff <= 14 && diff >= 0) insuranceStatus = `Expires in ${Math.ceil(diff)} days`;
                            else if (diff < 0) insuranceStatus = "Overdue";
                        }

                        allAlerts.push({
                            owner: email,
                            vehicleName: v.name,
                            roadtaxExpiry: v.roadtaxExpiry,
                            roadTaxStatus,
                            insuranceExpiry: v.insuranceExpiry,
                            insuranceStatus
                        });
                    });
                }

                return {
                    content: [{ type: "text", text: JSON.stringify(allAlerts, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error fetching reminders: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // 2. Vehicles
    server.registerTool(
        "get_vehicles",
        {
            description: "Get vehicles for a user. Requires their Google OAuth access token.",
            inputSchema: z.object({
                accessToken: z.string().describe("Google OAuth Access Token of the user")
            })
        },
        async (args: any) => {
            try {
                const vehicles = await fetchVehicles(args.accessToken);
                return {
                    content: [{ type: "text", text: JSON.stringify(vehicles, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error fetching vehicles: ${error.message}` }],
                    isError: true
                };
            }
        }
    );

    // 3. Maintenance Records
    server.registerTool(
        "get_maintenance_records",
        {
            description: "Get maintenance records for a user. Requires their Google OAuth access token.",
            inputSchema: z.object({
                accessToken: z.string().describe("Google OAuth Access Token of the user")
            })
        },
        async (args: any) => {
            try {
                const records = await fetchMaintenanceRecords(args.accessToken);
                return {
                    content: [{ type: "text", text: JSON.stringify(records, null, 2) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error fetching records: ${error.message}` }],
                    isError: true
                };
            }
        }
    );
});

export const POST = handler;
export const GET = handler;
