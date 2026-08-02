import { createMcpHandler } from "mcp-handler";
import { kv } from "@vercel/kv";
import { 
    fetchVehicles, 
    fetchMaintenanceRecords, 
    addVehicle, 
    updateVehicle, 
    deleteVehicle, 
    updateVehicleMileage, 
    appendMaintenanceRecord 
} from "@/lib/googleSheets";
import { z } from "zod";
import { google } from "googleapis";
import { Readable } from "stream";

const handler = createMcpHandler((server) => {
    // 1. Reminders
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

    // 2. Fetch Vehicles
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

    // 3. Add Vehicle
    server.registerTool(
        "add_vehicle",
        {
            description: "Add a new vehicle to the database.",
            inputSchema: z.object({
                accessToken: z.string().describe("Google OAuth Access Token"),
                name: z.string().describe("Name/License plate of the vehicle"),
                type: z.string().describe("Type of vehicle (e.g., Car, Motorcycle)"),
                color: z.string().describe("Color hex code or name"),
                roadtaxExpiry: z.string().optional().describe("Roadtax expiry date (YYYY-MM-DD)"),
                insuranceExpiry: z.string().optional().describe("Insurance expiry date (YYYY-MM-DD)"),
                insuranceCompany: z.string().optional().describe("Insurance company name")
            })
        },
        async (args: any) => {
            try {
                await addVehicle(args.accessToken, {
                    name: args.name,
                    color: args.color || "#3b82f6",
                    type: args.type || "Car",
                    roadtaxExpiry: args.roadtaxExpiry || "",
                    insuranceExpiry: args.insuranceExpiry || "",
                    insuranceCompany: args.insuranceCompany || ""
                });
                return { content: [{ type: "text", text: JSON.stringify({ success: true, message: `Vehicle ${args.name} added.` }) }] };
            } catch (error: any) {
                return { content: [{ type: "text", text: `Error adding vehicle: ${error.message}` }], isError: true };
            }
        }
    );

    // 4. Update Vehicle
    server.registerTool(
        "update_vehicle",
        {
            description: "Update details of an existing vehicle.",
            inputSchema: z.object({
                accessToken: z.string().describe("Google OAuth Access Token"),
                originalName: z.string().describe("The current name of the vehicle"),
                name: z.string().describe("The new name of the vehicle"),
                type: z.string().describe("Type of vehicle"),
                color: z.string().describe("Color hex code or name"),
                roadtaxExpiry: z.string().optional().describe("Roadtax expiry date (YYYY-MM-DD)"),
                insuranceExpiry: z.string().optional().describe("Insurance expiry date (YYYY-MM-DD)"),
                insuranceCompany: z.string().optional().describe("Insurance company name")
            })
        },
        async (args: any) => {
            try {
                await updateVehicle(args.accessToken, args.originalName, {
                    name: args.name,
                    color: args.color,
                    type: args.type,
                    roadtaxExpiry: args.roadtaxExpiry || "",
                    insuranceExpiry: args.insuranceExpiry || "",
                    insuranceCompany: args.insuranceCompany || ""
                });
                return { content: [{ type: "text", text: JSON.stringify({ success: true, message: `Vehicle updated to ${args.name}.` }) }] };
            } catch (error: any) {
                return { content: [{ type: "text", text: `Error updating vehicle: ${error.message}` }], isError: true };
            }
        }
    );

    // 5. Delete Vehicle
    server.registerTool(
        "delete_vehicle",
        {
            description: "Delete a vehicle from the database.",
            inputSchema: z.object({
                accessToken: z.string().describe("Google OAuth Access Token"),
                vehicleName: z.string().describe("Name of the vehicle to delete")
            })
        },
        async (args: any) => {
            try {
                await deleteVehicle(args.accessToken, args.vehicleName);
                return { content: [{ type: "text", text: JSON.stringify({ success: true, message: `Vehicle ${args.vehicleName} deleted.` }) }] };
            } catch (error: any) {
                return { content: [{ type: "text", text: `Error deleting vehicle: ${error.message}` }], isError: true };
            }
        }
    );

    // 6. Update Vehicle Mileage
    server.registerTool(
        "update_vehicle_mileage",
        {
            description: "Update the current mileage of a vehicle.",
            inputSchema: z.object({
                accessToken: z.string().describe("Google OAuth Access Token"),
                vehicleName: z.string().describe("Name of the vehicle"),
                mileage: z.number().describe("New mileage number")
            })
        },
        async (args: any) => {
            try {
                await updateVehicleMileage(args.accessToken, args.vehicleName, args.mileage);
                return { content: [{ type: "text", text: JSON.stringify({ success: true, message: `Mileage for ${args.vehicleName} updated to ${args.mileage}.` }) }] };
            } catch (error: any) {
                return { content: [{ type: "text", text: `Error updating mileage: ${error.message}` }], isError: true };
            }
        }
    );

    // 7. Fetch Maintenance Records
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

    // 8. Append Maintenance Record
    server.registerTool(
        "append_maintenance_record",
        {
            description: "Insert a new maintenance record.",
            inputSchema: z.object({
                accessToken: z.string().describe("Google OAuth Access Token"),
                vehicleType: z.string().describe("Vehicle Name/Identifier"),
                serviceType: z.string().optional().describe("Type of service"),
                dateDone: z.string().optional().describe("Date of service"),
                lastMileage: z.string().optional().describe("Mileage at time of service"),
                nextInterval: z.string().optional().describe("Next service interval (e.g. 10000)"),
                nextServiceCalculated: z.string().optional().describe("Calculated next service mileage"),
                workshop: z.string().optional().describe("Workshop name"),
                partBrand: z.string().optional().describe("Brand of parts used"),
                locationFront: z.string().optional().describe("Front tyre/brakes location"),
                locationRear: z.string().optional().describe("Rear tyre/brakes location"),
                details: z.string().optional().describe("Detailed description of work done"),
                cost: z.string().optional().describe("Total cost (e.g. RM150)"),
                receipt: z.string().optional().describe("Receipt web view link"),
                remark: z.string().optional().describe("Additional remarks"),
                mapLink: z.string().optional().describe("Google maps link for workshop"),
                partModel: z.string().optional().describe("Model of the part used")
            })
        },
        async (args: any) => {
            try {
                const timestamp = new Date().toLocaleString("en-GB");
                const rowData = new Array(17).fill("");
                rowData[0] = timestamp;
                rowData[1] = args.vehicleType || "";
                rowData[2] = args.serviceType || "";
                rowData[3] = args.dateDone || "";
                rowData[4] = String(args.lastMileage || "");
                rowData[5] = String(args.nextInterval || "");
                rowData[6] = String(args.nextServiceCalculated || "");
                rowData[7] = args.workshop || "";
                rowData[8] = args.partBrand || "";
                rowData[9] = args.locationFront || "";
                rowData[10] = args.locationRear || "";
                rowData[11] = args.details || "";
                rowData[12] = String(args.cost || "");
                rowData[13] = args.receipt || "";
                rowData[14] = args.remark || "";
                rowData[15] = args.mapLink || "";
                rowData[16] = args.partModel || "";

                const result = await appendMaintenanceRecord(args.accessToken, rowData);
                return { content: [{ type: "text", text: JSON.stringify({ success: true, result }) }] };
            } catch (error: any) {
                return { content: [{ type: "text", text: `Error appending record: ${error.message}` }], isError: true };
            }
        }
    );

    // 9. Upload Receipt to Drive
    server.registerTool(
        "upload_receipt_to_drive",
        {
            description: "Upload a base64 encoded receipt or image to Google Drive. Returns the webViewLink.",
            inputSchema: z.object({
                accessToken: z.string().describe("Google OAuth Access Token"),
                fileName: z.string().describe("Name of the file (e.g. receipt.jpg)"),
                mimeType: z.string().describe("MIME type (e.g. image/jpeg)"),
                base64Data: z.string().describe("Base64 encoded string of the file content")
            })
        },
        async (args: any) => {
            try {
                const buffer = Buffer.from(args.base64Data, 'base64');
                const auth = new google.auth.OAuth2();
                auth.setCredentials({ access_token: args.accessToken });
                const drive = google.drive({ version: 'v3', auth });

                const fileMetadata: any = {
                    name: `Vehicle_Receipt_${Date.now()}_${args.fileName}`,
                    mimeType: args.mimeType,
                };

                let targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
                if (targetFolderId) {
                    try {
                        await drive.files.get({ fileId: targetFolderId, fields: 'id' });
                    } catch (err: any) {
                        targetFolderId = undefined;
                    }
                }

                if (!targetFolderId) {
                    const FOLDER_NAME = "Vehicle Maintenance Receipt";
                    const searchRes = await drive.files.list({
                        q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                        spaces: 'drive',
                        fields: 'files(id, name)',
                    });

                    if (searchRes.data.files && searchRes.data.files.length > 0) {
                        targetFolderId = searchRes.data.files[0].id!;
                    } else {
                        const createRes = await drive.files.create({
                            requestBody: {
                                name: FOLDER_NAME,
                                mimeType: 'application/vnd.google-apps.folder',
                            },
                            fields: 'id'
                        });
                        targetFolderId = createRes.data.id!;
                    }
                }

                if (targetFolderId) {
                    fileMetadata.parents = [targetFolderId];
                }

                const media = {
                    mimeType: args.mimeType,
                    body: Readable.from(buffer),
                };

                const uploadRes = await drive.files.create({
                    requestBody: fileMetadata,
                    media: media,
                    fields: 'id, webViewLink'
                } as any);

                const fileId = uploadRes.data.id;
                if (!fileId) {
                    throw new Error("Failed to retrieve file ID after upload");
                }

                await drive.permissions.create({
                    fileId: fileId,
                    requestBody: {
                        role: 'reader',
                        type: 'anyone',
                    },
                });

                return {
                    content: [{ type: "text", text: JSON.stringify({ success: true, webViewLink: uploadRes.data.webViewLink }) }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error uploading file: ${error.message}` }],
                    isError: true
                };
            }
        }
    );
});

export const POST = handler;
export const GET = handler;
