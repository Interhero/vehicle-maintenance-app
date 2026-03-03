import { NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const accessToken = authHeader.split(" ")[1];

        const body = await request.json();
        const { sourceId, targetId } = body;

        if (!sourceId || !targetId) {
            return NextResponse.json({ error: "Missing sourceId or targetId" }, { status: 400 });
        }

        const sheets = await getGoogleSheetsClient(accessToken);

        // 1. Fetch Source Data (Legacy format)
        // Hardcoding sheet name based on the known legacy source ("Maintainance Record")
        console.log("Fetching legacy data from:", sourceId);
        const sourceRes = await sheets.spreadsheets.values.get({
            spreadsheetId: sourceId,
            range: "'Maintainance Record'!A2:AB", // Grabbing everything ignoring header
        });

        const rows = sourceRes.data.values;
        if (!rows || rows.length === 0) {
            return NextResponse.json({ message: "No data found to migrate." }, { status: 200 });
        }

        console.log(`Found ${rows.length} rows to migrate.`);

        // 2. Transform Data to New 15-Column Gapless Format
        const transformedRows = rows.map((row: any[]) => {
            const newRow = new Array(15).fill("");

            // Standard mapping
            newRow[0] = row[0] || ""; // Timestamp
            newRow[1] = row[1] || ""; // Vehicle
            newRow[2] = row[2] || ""; // Service Type
            newRow[3] = row[3] || ""; // Date Done
            newRow[4] = row[4] || ""; // Current Mileage
            newRow[5] = row[5] || ""; // Next Service Interval
            newRow[6] = row[6] || ""; // Next Service Calculated
            newRow[7] = row[7] || ""; // Workshop

            // Reconstruct Part Brand from scattered columns
            let brand = "";
            if (row[8]) brand = row[8];
            else if (row[11]) brand = row[11];
            else if (row[13]) brand = row[13];
            newRow[8] = brand; // Brand of Part

            // Location Matrices
            newRow[9] = row[9] || ""; // Front
            newRow[10] = row[10] || ""; // Rear

            // Assemble Extra Details (from scattered part Model info AND the original Details column)
            let detailsText = "";
            let legacyDetailsColumn = row[15] || ""; // Old 'Details'

            if (legacyDetailsColumn.includes("Model:")) {
                detailsText = legacyDetailsColumn;
            } else {
                if (legacyDetailsColumn) detailsText = legacyDetailsColumn;
            }
            newRow[11] = detailsText; // Extra Details

            // Trailing financials and reciepts
            newRow[12] = row[16] || ""; // Cost (RM)
            newRow[13] = row[17] || ""; // Receipt link
            newRow[14] = row[18] || ""; // Remarks

            return newRow;
        });

        // 3. Append to Target Spreadsheet
        console.log("Appending transformed data to:", targetId);
        const targetRes = await sheets.spreadsheets.values.append({
            spreadsheetId: targetId,
            range: "'Maintainance Record'!A:O", // new 15 column breadth
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            requestBody: {
                values: transformedRows
            }
        });

        return NextResponse.json({
            success: true,
            migratedRows: transformedRows.length,
            result: targetRes.data
        }, { status: 200 });

    } catch (error: any) {
        console.error("Migration Failed:", error.message);
        return NextResponse.json({ error: "Migration Failed", details: error.message }, { status: 500 });
    }
}
