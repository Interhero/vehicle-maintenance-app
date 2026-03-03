import { NextResponse } from "next/server";
import { fetchMaintenanceRecords, appendMaintenanceRecord } from "@/lib/googleSheets";

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const accessToken = authHeader.split(" ")[1];
        const records = await fetchMaintenanceRecords(accessToken);
        return NextResponse.json({ records }, { status: 200 });
    } catch (error: any) {
        console.error("Failed to fetch records:", error.message);
        return NextResponse.json(
            { error: "Failed to fetch records" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const accessToken = authHeader.split(" ")[1];
        const body = await request.json();

        const timestamp = new Date().toLocaleString("en-GB");

        // Build a sparse array up to 15 cols (A to O)
        const rowData = new Array(15).fill("");
        rowData[0] = timestamp;
        rowData[1] = body.vehicleType || "";
        rowData[2] = body.serviceType || "";
        rowData[3] = body.dateDone || "";
        rowData[4] = body.lastMileage || "";
        rowData[5] = body.nextInterval || "";
        rowData[6] = body.nextServiceCalculated || "";
        rowData[7] = body.workshop || "";

        // Unify all Brand mapping into Column I (8)
        rowData[8] = body.partBrand || "";

        // Dynamically map custom part parameters across Column J - K based on Form topology
        if (body.locationMatrix) {
            if (body.locationMatrix.includes("Front") || body.locationMatrix.includes("Both")) rowData[9] = body.locationMatrix;
            if (body.locationMatrix.includes("Rear") || body.locationMatrix.includes("Both") || body.locationMatrix.includes("Back")) rowData[10] = body.locationMatrix;
        }

        let descriptiveText = body.details || "";
        if (body.partModel) descriptiveText = `Model: ${body.partModel}${descriptiveText ? ` - ${descriptiveText}` : ''}`;
        rowData[11] = descriptiveText;

        rowData[12] = body.cost || "";
        rowData[13] = body.receipt || "";
        rowData[14] = body.remark || "";

        const result = await appendMaintenanceRecord(accessToken, rowData);
        return NextResponse.json({ success: true, result }, { status: 200 });
    } catch (error: any) {
        console.error("Failed to append record:", error.message);
        return NextResponse.json(
            { error: "Failed to append record" },
            { status: 500 }
        );
    }
}
