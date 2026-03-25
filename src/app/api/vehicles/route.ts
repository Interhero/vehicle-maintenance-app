import { NextResponse } from "next/server";
import { fetchVehicles, addVehicle, deleteVehicle, updateVehicle, updateVehicleMileage, VehicleData } from "@/lib/googleSheets";
import { google } from "googleapis";

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const accessToken = authHeader.split(" ")[1];

        const vehicles = await fetchVehicles(accessToken);
        return NextResponse.json({ vehicles }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const accessToken = authHeader.split(" ")[1];

        const formData = await request.formData();
        console.log("API Received FormData Keys:", Array.from(formData.keys()));
        console.log("Has Image Field:", formData.has("image"));

        const vehicleName = formData.get("vehicleName") as string;
        const vehicleType = formData.get("vehicleType") as string || "Car";
        const color = formData.get("color") as string || "#3b82f6";
        const roadtaxExpiry = formData.get("roadtaxExpiry") as string || "";
        const insuranceExpiry = formData.get("insuranceExpiry") as string || "";
        const insuranceCompany = formData.get("insuranceCompany") as string || "";

        if (!vehicleName) return NextResponse.json({ error: "Name required" }, { status: 400 });

        const vehicleData: VehicleData = {
            name: vehicleName,
            color: color,
            type: vehicleType,
            roadtaxExpiry,
            insuranceExpiry,
            insuranceCompany
        };

        await addVehicle(accessToken, vehicleData);
        return NextResponse.json({ success: true, vehicle: vehicleData }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const accessToken = authHeader.split(" ")[1];

        const { vehicleName } = await request.json();
        if (!vehicleName) return NextResponse.json({ error: "Name required" }, { status: 400 });

        await deleteVehicle(accessToken, vehicleName);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const accessToken = authHeader.split(" ")[1];

        const formData = await request.formData();

        const originalName = formData.get("originalName") as string;
        const vehicleName = formData.get("vehicleName") as string;
        const vehicleType = formData.get("vehicleType") as string || "Car";
        const color = formData.get("color") as string || "#3b82f6";
        const roadtaxExpiry = formData.get("roadtaxExpiry") as string || "";
        const insuranceExpiry = formData.get("insuranceExpiry") as string || "";
        const insuranceCompany = formData.get("insuranceCompany") as string || "";

        if (!originalName || !vehicleName) return NextResponse.json({ error: "Original and New Name required" }, { status: 400 });

        const vehicleData: VehicleData = {
            name: vehicleName,
            color: color,
            type: vehicleType,
            roadtaxExpiry,
            insuranceExpiry,
            insuranceCompany
        };

        await updateVehicle(accessToken, originalName, vehicleData);
        return NextResponse.json({ success: true, vehicle: vehicleData }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const accessToken = authHeader.split(" ")[1];

        const { vehicleName, mileage } = await request.json();
        if (!vehicleName || mileage === undefined) {
            return NextResponse.json({ error: "vehicleName and mileage required" }, { status: 400 });
        }

        const mileageNum = parseInt(mileage, 10);
        if (isNaN(mileageNum) || mileageNum < 0) {
            return NextResponse.json({ error: "Invalid mileage value" }, { status: 400 });
        }

        await updateVehicleMileage(accessToken, vehicleName, mileageNum);
        return NextResponse.json({ success: true, mileage: mileageNum }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
