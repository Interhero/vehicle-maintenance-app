import { google } from "googleapis";

export async function getGoogleSheetsClient(accessToken: string) {
    if (!accessToken) {
        throw new Error("No access token provided.");
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    return google.sheets({ version: "v4", auth });
}

export async function getOrProvisionPublicBlocklist(accessToken: string): Promise<string> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: "v4", auth });

    const FILE_NAME = "Vehicle Maintenance Blocklist";

    // 1. Check if the blocklist already exists
    const searchRes = await drive.files.list({
        q: `name='${FILE_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name)',
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
        return searchRes.data.files[0].id!;
    }

    console.log("No blocklist found. Provisioning a new public blocklist sheet.");

    // 2. Create the new Spreadsheet
    const createRes = await sheets.spreadsheets.create({
        requestBody: {
            properties: { title: FILE_NAME },
            sheets: [
                { properties: { title: "Revoked Links" } }
            ]
        }
    });

    const blocklistId = createRes.data.spreadsheetId!;

    // 3. Initialize the Headers
    await sheets.spreadsheets.values.update({
        spreadsheetId: blocklistId,
        range: "'Revoked Links'!A1:B1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [["Revoked Share ID", "Timestamp"]]
        }
    });

    // 4. Set the permissions so ANYONE with the link can view it anonymously
    await drive.permissions.create({
        fileId: blocklistId,
        requestBody: {
            type: 'anyone',
            role: 'reader'
        }
    });

    return blocklistId;
}

export async function resolveSpreadsheetId(accessToken: string): Promise<string> {
    const sheets = await getGoogleSheetsClient(accessToken);
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Search their personal Google Drive for the Database File
    const FILE_NAME = "Vehicle Maintenance App Data";
    const searchRes = await drive.files.list({
        q: `name='${FILE_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name)',
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
        console.log("Found existing personal database for user.");
        return searchRes.data.files[0].id!;
    }

    // 2. Legacy Fallback (Only use if they don't have a personal DB yet, and they somehow own the original environment variable sheet)
    const adminSheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (adminSheetId) {
        try {
            // We check ownership to ensure strangers aren't latching onto a shared/public file.
            const fileMeta = await drive.files.get({ fileId: adminSheetId, fields: 'ownedByMe' });
            if (fileMeta.data.ownedByMe) {
                console.log("Admin sheet ownership verified.");
                return adminSheetId;
            }
        } catch (err: any) {
            console.log("Admin sheet bypassed.");
        }
    }

    // 3. Auto-Provisioning: Create the file if it doesn't exist
    console.log("No database found. Auto-provisioning new Google Sheet for user.");
    const createRes = await sheets.spreadsheets.create({
        requestBody: {
            properties: { title: FILE_NAME },
            sheets: [
                { properties: { title: "Maintainance Record" } },
                { properties: { title: "Vehicles" } }
            ]
        }
    });

    const newSpreadsheetId = createRes.data.spreadsheetId!;

    // 4. Initialize the Headers for the new spreadsheet
    await sheets.spreadsheets.values.update({
        spreadsheetId: newSpreadsheetId,
        range: "'Maintainance Record'!A1:Q1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [["Timestamp", "Vehicle", "Service Type", "Date Done", "Current Mileage", "Next Service Interval", "Next Service Calculated", "Workshop", "Brand of Part", "Location Matrix (Front)", "Location Matrix (Rear)", "Extra Details", "Cost (RM)", "Receipt / Notes", "Additional remarks", "Map Link", "Part Model"]]
        }
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: newSpreadsheetId,
        range: "'Vehicles'!A1:G1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [["Vehicle Name", "Color", "Type", "Mileage", "Roadtax Expiry", "Insurance Expiry", "Insurance Company"]]
        }
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: newSpreadsheetId,
        range: "'Shared Links'!A1:F1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [["Share ID", "Vehicle", "Service", "Created Timestamp", "Expires Timestamp", "Status"]]
        }
    });

    return newSpreadsheetId;
}

export async function fetchMaintenanceRecords(accessToken: string) {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const spreadsheetId = await resolveSpreadsheetId(accessToken);

        // First, get the spreadsheet metadata to find the name of the first sheet
        const metadata = await sheets.spreadsheets.get({
            spreadsheetId,
        });

        if (!metadata.data.sheets || metadata.data.sheets.length === 0) {
            console.error("No sheets found in the document");
            return [];
        }

        // Get the title of the very first sheet
        let firstSheetName = metadata.data.sheets[0].properties?.title;

        // Fallback: Hardcode to the visible sheet if it's picking up a hidden one by mistake
        if (firstSheetName !== "Maintainance Record") {
            console.log("First sheet is", firstSheetName, "but forcing to 'Maintainance Record'");
            firstSheetName = "Maintainance Record";
        }

        if (!firstSheetName) {
            console.error("Could not determine sheet name");
            return [];
        }

        const rangeParams = `'${firstSheetName}'!A2:AB`;
        console.log("Fetching from range:", rangeParams);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: rangeParams,
        });

        console.log("Raw Sheets Data rows count:", response.data.values?.length);

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return [];
        }

        console.log("First Row Data Layout:", JSON.stringify(rows[0]));
        console.log("Raw Last Row:", JSON.stringify(rows[rows.length - 1]));

        // Filter out empty or invalid rows
        const validRows = rows.filter((row: any[]) => {
            if (!row || row.length < 2) return false;
            const v = String(row[1]).trim();
            return v.length > 0;
        });

        console.log("Last 5 rows for dashboard rendering:", JSON.stringify(validRows.slice(-5)));

        return validRows.map((row: any[]) => ({
            timestamp: row[0] || "",
            // Use fallback matching logic for columns
            vehicle: String(row[1] || "").trim() || "Unknown Vehicle",
            serviceType: String(row[2] || "General Service"),
            dateDone: String(row[3] || "N/A"),
            lastMileage: String(row[4] || ""),
            nextMileageInterval: String(row[5] || ""),
            nextServiceCalculated: String(row[6] || ""),
            workshop: String(row[7] || ""),

            // Ensure backwards compatibility with old 28-col schema and new 15-col schema
            cost: (() => {
                for (let i = row.length - 1; i >= 10; i--) {
                    const val = String(row[i]).trim();
                    if (!val) continue;

                    // Match pattern "RM 110" or "RM110" or "rm 110"
                    const rmMatch = val.match(/rm\s*(\d+(\.\d+)?)/i);
                    if (rmMatch && rmMatch[1]) {
                        return rmMatch[1];
                    }

                    // Otherwise if it's just a pure number (excluding common trailing binary/ID flags)
                    if (!isNaN(Number(val)) && val !== "1" && val !== "0" && val !== "-" && !val.includes("/")) {
                        return val;
                    }
                }
                return "0";
            })(),
            receipt: (() => {
                const mapL = row[15] || "";
                for (let i = row.length - 1; i >= 10; i--) {
                    const val = String(row[i]);
                    if (val.includes("http") && val !== mapL && !val.includes("maps.google") && !val.includes("goo.gl/map") && !val.includes("waze.com") && !val.includes("apple.com/map")) {
                        return val;
                    }
                }
                return "";
            })(),
            mapLink: row[15] || "", // Column P
            partBrand: row[8] || "", // Column I
            partModel: row[16] || "", // Column Q
            details: row[11] || "", // Column L
            locationFront: row[9] || "", // Column J
            locationRear: row[10] || "", // Column K
            // Metadata for sharing
            id: row[0] + "_" + row[1] // Unique ID based on timestamp and vehicle
        }));
    } catch (error) {
        console.error("Error fetching records:", error);
        return [];
    }
}

export async function appendMaintenanceRecord(accessToken: string, rowData: any[]) {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const spreadsheetId = await resolveSpreadsheetId(accessToken);

        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        let firstSheetName = metadata.data.sheets?.[0]?.properties?.title;

        // Fallback: Hardcode to the visible sheet if it's picking up a hidden one by mistake
        if (firstSheetName !== "Maintainance Record") {
            firstSheetName = "Maintainance Record";
        }

        // Get the exact number of rows currently in Column A to find the true bottom
        const columnAData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${firstSheetName}'!A:A`,
        });

        // Calculate the next absolute empty row index
        const nextTargetRow = (columnAData.data.values?.length || 0) + 1;

        // Force a direct strict UPDATE to bypass any broken bounding-box heuristics in Google Sheets
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${firstSheetName}'!A${nextTargetRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData],
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error appending record:", error);
        throw error;
    }
}

async function ensureVehiclesTab(sheets: any, spreadsheetId: string) {
    try {
        await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Vehicles'!A1" });
    } catch (e: any) {
        if (e.message?.includes("Unable to parse range")) {
            console.log("Vehicles tab missing. Creating it now to ensure backwards compatibility.");
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests: [{ addSheet: { properties: { title: "Vehicles" } } }] }
            });
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: "'Vehicles'!A1:G3",
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [
                        ["Vehicle Name", "Image URL", "Vehicle Type", "Mileage", "Roadtax Expiry", "Insurance Expiry", "Insurance Company"],
                        ["Honda City WXE7539", "", "Car", "0", "", "", ""],
                        ["Yamaha Y16ZR VKB6835", "", "Motorcycle", "0", "", "", ""]
                    ]
                }
            });
        }
    }
}

export interface VehicleData {
    name: string;
    color: string;
    type: string;
    mileage?: number;
    roadtaxExpiry?: string;
    insuranceExpiry?: string;
    insuranceCompany?: string;
}

export async function fetchVehicles(accessToken: string): Promise<VehicleData[]> {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const spreadsheetId = await resolveSpreadsheetId(accessToken);

        await ensureVehiclesTab(sheets, spreadsheetId);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'Vehicles'!A2:D",
        });

        if (!response.data.values) return [];
        return response.data.values.map(row => {
            let colorVal = row[1];
            if (!colorVal || typeof colorVal !== 'string' || !colorVal.startsWith('#')) {
                colorVal = "#3b82f6"; // Default Blue for missing or old Google Drive URL strings
            }
            const mileage = parseInt(row[3]);
            return {
                name: row[0] || "",
                color: colorVal,
                type: row[2] || "Car",
                mileage: isNaN(mileage) ? 0 : mileage,
                roadtaxExpiry: row[4] || "",
                insuranceExpiry: row[5] || "",
                insuranceCompany: row[6] || ""
            };
        }).filter(v => v.name.length > 0);
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        return [];
    }
}

export async function addVehicle(accessToken: string, vehicle: VehicleData) {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const spreadsheetId = await resolveSpreadsheetId(accessToken);

        await ensureVehiclesTab(sheets, spreadsheetId);

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "'Vehicles'!A:G",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[
                    vehicle.name,
                    vehicle.color,
                    vehicle.type,
                    vehicle.mileage || 0,
                    vehicle.roadtaxExpiry || "",
                    vehicle.insuranceExpiry || "",
                    vehicle.insuranceCompany || ""
                ]]
            },
        });
        return true;
    } catch (error) {
        console.error("Error adding vehicle:", error);
        throw error;
    }
}

export async function deleteVehicle(accessToken: string, vehicleName: string) {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const spreadsheetId = await resolveSpreadsheetId(accessToken);

        await ensureVehiclesTab(sheets, spreadsheetId);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'Vehicles'!A2:D",
        });

        let currentVehicles: any[] = [];
        if (response.data.values) {
            currentVehicles = response.data.values;
        }

        const newVehiclesRows = currentVehicles.filter(row => row[0] !== vehicleName);

        // Clear the entire column block
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: "'Vehicles'!A2:G",
        });

        if (newVehiclesRows.length > 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: "'Vehicles'!A2",
                valueInputOption: "USER_ENTERED",
                requestBody: { values: newVehiclesRows }
            });
        }
        return true;
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        throw error;
    }
}

export async function updateVehicle(accessToken: string, originalName: string, updatedVehicle: VehicleData) {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const spreadsheetId = await resolveSpreadsheetId(accessToken);

        // 1. Update the 'Vehicles' tab row
        await ensureVehiclesTab(sheets, spreadsheetId);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'Vehicles'!A2:D",
        });

        let vehicles = response.data.values || [];
        let updated = false;

        for (let i = 0; i < vehicles.length; i++) {
            if (vehicles[i][0] === originalName) {
                // Preserve existing mileage in column D if not overridden via some other flow, but here we just keep existing mileage.
                const existingMileage = vehicles[i][3] || "0";
                vehicles[i] = [
                    updatedVehicle.name,
                    updatedVehicle.color,
                    updatedVehicle.type,
                    existingMileage,
                    updatedVehicle.roadtaxExpiry || "",
                    updatedVehicle.insuranceExpiry || "",
                    updatedVehicle.insuranceCompany || ""
                ];
                updated = true;
                break;
            }
        }

        if (updated) {
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: "'Vehicles'!A2:G",
            });
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: "'Vehicles'!A2",
                valueInputOption: "USER_ENTERED",
                requestBody: { values: vehicles }
            });
        }

        // 2. Cascade update to 'Maintainance Record' column B if identity name changed
        if (originalName !== updatedVehicle.name) {
            const metadata = await sheets.spreadsheets.get({ spreadsheetId });
            let firstSheetName = metadata.data.sheets?.[0]?.properties?.title || "Maintainance Record";
            if (firstSheetName !== "Maintainance Record") firstSheetName = "Maintainance Record";

            const recordsResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `'${firstSheetName}'!B2:B`,
            });

            const vehicleColumn = recordsResponse.data.values;
            if (vehicleColumn) {
                let needsRecordsUpdate = false;
                for (let i = 0; i < vehicleColumn.length; i++) {
                    if (vehicleColumn[i][0] === originalName) {
                        vehicleColumn[i][0] = updatedVehicle.name;
                        needsRecordsUpdate = true;
                    }
                }

                if (needsRecordsUpdate) {
                    await sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: `'${firstSheetName}'!B2:B${vehicleColumn.length + 1}`,
                        valueInputOption: "USER_ENTERED",
                        requestBody: { values: vehicleColumn }
                    });
                }
            }
        }

        return true;
    } catch (error) {
        console.error("Error updating vehicle:", error);
        throw error;
    }
}

export async function updateVehicleMileage(accessToken: string, vehicleName: string, mileage: number) {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const spreadsheetId = await resolveSpreadsheetId(accessToken);

        await ensureVehiclesTab(sheets, spreadsheetId);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'Vehicles'!A2:D",
        });

        const vehicles = response.data.values || [];
        let targetRow = -1;

        for (let i = 0; i < vehicles.length; i++) {
            if (vehicles[i][0] === vehicleName) {
                targetRow = i + 2; // +2 because row 1 is header and array is 0-indexed
                break;
            }
        }

        if (targetRow === -1) {
            throw new Error(`Vehicle "${vehicleName}" not found`);
        }

        // Update only the mileage cell (column D) for this vehicle
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'Vehicles'!D${targetRow}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[mileage]]
            }
        });

        return true;
    } catch (error) {
        console.error("Error updating vehicle mileage:", error);
        throw error;
    }
}

export async function saveSharedLink(accessToken: string, shareData: any[]) {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const spreadsheetId = await resolveSpreadsheetId(accessToken);

        // Ensure "Shared Links" sheet exists
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        const hasSharedLinksSheet = metadata.data.sheets?.some(s => s.properties?.title === "Shared Links");

        if (!hasSharedLinksSheet) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: { properties: { title: "Shared Links" } }
                    }]
                }
            });
            // Initialize headers
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: "'Shared Links'!A1:F1",
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [["Share ID", "Vehicle", "Service", "Created Timestamp", "Expires Timestamp", "Status"]]
                }
            });
        }

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "'Shared Links'!A:F",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [shareData] }
        });
    } catch (error) {
        console.error("Error saving shared link:", error);
    }
}

export async function fetchSharedLinks(accessToken: string) {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const spreadsheetId = await resolveSpreadsheetId(accessToken);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'Shared Links'!A:F"
        });

        const rows = response.data.values || [];
        if (rows.length <= 1) return [];

        return rows.slice(1).map(row => ({
            id: row[0],
            vehicle: row[1],
            service: row[2],
            createdAt: row[3], // Now a numeric timestamp
            expiresAt: row[4], // Now a numeric timestamp
            status: row[5]
        }));
    } catch (error) {
        console.error("Error fetching shared links:", error);
        return [];
    }
}

export async function addLinkToPublicBlocklist(accessToken: string, shareId: string) {
    try {
        const blocklistId = await getOrProvisionPublicBlocklist(accessToken);
        const sheets = await getGoogleSheetsClient(accessToken);

        await sheets.spreadsheets.values.append({
            spreadsheetId: blocklistId,
            range: "'Revoked Links'!A:B",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[shareId, new Date().toISOString()]]
            }
        });
        console.log(`[BLOCKLIST] Added ${shareId} to Public Blocklist ${blocklistId}`);
    } catch (e: any) {
        console.error("[BLOCKLIST] Error writing to blocklist:", e.message);
    }
}

export async function revokeSharedLink(accessToken: string, shareId: string) {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const spreadsheetId = await resolveSpreadsheetId(accessToken);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'Shared Links'!A:A"
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(r => r[0] === shareId);

        if (rowIndex !== -1) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: "'Shared Links'!F" + (rowIndex + 1),
                valueInputOption: "USER_ENTERED",
                requestBody: { values: [["Revoked"]] }
            });

            // Ensure it's pushed to the Public Blocklist
            await addLinkToPublicBlocklist(accessToken, shareId);
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error revoking shared link:", error);
        return false;
    }
}

/**
 * Anonymously fetch the Public Blocklist Sheet as a CSV to check if a shareId is revoked.
 * This function requires NO authentication or API keys, allowing it to run freely on public routes.
 */
export async function checkPublicBlocklist(blocklistId: string, shareId: string): Promise<boolean> {
    try {
        if (!blocklistId) {
            console.error("[BLOCKLIST] No blocklistId provided to checker.");
            return true; // Fail closed if misconfigured
        }

        const url = `https://docs.google.com/spreadsheets/d/${blocklistId}/gviz/tq?tqx=out:csv&sheet=Revoked+Links`;
        const res = await fetch(url, { cache: 'no-store' }); // Ensure Next.js doesn't aggressively cache the HTTP request

        if (!res.ok) {
            console.error("[BLOCKLIST] Failed to fetch public blocklist CSV:", res.statusText);
            return true; // Fail closed: if we can't verify safety, assume it's revoked
        }

        const csvText = await res.text();

        // CSV parsing: simple string check. Quotes are often added by the CSV exporter.
        // We look for the raw ID or the ID wrapped in quotes.
        return csvText.includes(`"${shareId}"`) || csvText.includes(shareId);

    } catch (e: any) {
        console.error("[BLOCKLIST] Exception checking public blocklist:", e.message);
        return true; // Fail closed
    }
}

/**
 * Publicly accessible status check (Internal helper for public sharing page)
 */
export async function checkShareStatus(accessToken: string, spreadsheetId: string, shareId: string) {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'Shared Links'!A:F"
        });

        const rows = response.data.values || [];
        const row = rows.find(r => r[0] === shareId);

        if (row) {
            return {
                status: row[5],
                expiresAt: row[4]
            };
        }
        return null;
    } catch (error) {
        console.error("Error checking share status:", error);
        return null;
    }
}
