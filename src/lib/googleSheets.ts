import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getGoogleSheetsClient(accessToken: string) {
    if (!accessToken) {
        throw new Error("No access token provided.");
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    return google.sheets({ version: "v4", auth });
}

export async function fetchMaintenanceRecords(accessToken: string) {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

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

        // Filter out empty rows (where vehicle type doesn't contain a known string or length is too short)
        const validRows = rows.filter((row: any[]) => {
            if (!row || row.length < 2) return false;
            const v = String(row[1]).toLowerCase();
            return v.includes("honda") || v.includes("yamaha");
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

            // Look for non-empty text in columns 8 through 15 (parts, oils based on service)
            details: row.slice(8, 16).filter(Boolean).join(", "),

            // Costs might be raw numbers ("150") or embedded in text ("Service cost : RM 110")
            // Search backwards for the first identifiable cost
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
                for (let i = row.length - 1; i >= 10; i--) {
                    if (String(row[i]).includes("http")) return row[i];
                }
                return "";
            })()
        }));
    } catch (error) {
        console.error("Error fetching records:", error);
        return [];
    }
}

export async function appendMaintenanceRecord(accessToken: string, rowData: any[]) {
    try {
        const sheets = await getGoogleSheetsClient(accessToken);
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

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
