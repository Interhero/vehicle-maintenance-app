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

        // Build a sparse array up to 17 cols (A to Q)
        const rowData = new Array(17).fill("");
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

        // Map discrete Location Matrix states directly to Column J (Front) and K (Rear)
        rowData[9] = body.locationFront || "";
        rowData[10] = body.locationRear || "";

        // Column L (11) is raw details only now
        rowData[11] = body.details || "";

        rowData[12] = body.cost || "";
        rowData[13] = body.receipt || "";
        rowData[14] = body.remark || "";
        rowData[15] = body.mapLink || "";
        rowData[16] = body.partModel || "";

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
