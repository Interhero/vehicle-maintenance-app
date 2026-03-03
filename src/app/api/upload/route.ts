import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const accessToken = authHeader.split(" ")[1];

        // Parse the multipart form data
        const formData = await request.formData();
        const file = formData.get("receipt") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Convert the logical File object to an array buffer then a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Instantiate Drive API Client
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const drive = google.drive({ version: 'v3', auth });

        // 1. Upload the file to the user's Drive
        const fileMetadata: any = {
            name: `Vehicle_Receipt_${Date.now()}_${file.name}`,
            mimeType: file.type,
        };

        // If a specific folder ID is in the environment variables, verify the active user has permissions to see/write to it
        let targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (targetFolderId) {
            try {
                // Determine if this access token actually has sight of the admin folder
                await drive.files.get({ fileId: targetFolderId, fields: 'id' });
                console.log("Uploading receipt to Admin folder.");
            } catch (err: any) {
                console.log("User token lacks access to Admin folder. Falling back to personal root Drive upload.");
                targetFolderId = undefined;
            }
        }

        if (!targetFolderId) {
            // Find or create "Vehicle Maintenance Receipt" folder
            const FOLDER_NAME = "Vehicle Maintenance Receipt";
            const searchRes = await drive.files.list({
                q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name)',
            });

            if (searchRes.data.files && searchRes.data.files.length > 0) {
                targetFolderId = searchRes.data.files[0].id!;
                console.log("Uploading receipt to existing personal folder.");
            } else {
                console.log("Creating new personal folder for receipts.");
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
            mimeType: file.type,
            body: require('stream').Readable.from(buffer),
        };

        const uploadRes = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink'
        } as any); // Type assertion needed for complex upload signatures

        const fileId = uploadRes.data.id;
        if (!fileId) {
            throw new Error("Failed to retrieve file ID after upload");
        }

        // 2. Adjust permissions so anyone with the link can view it 
        // (Allows the spreadsheet to hotlink to it without explicit sharing steps)
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // 3. Return the public web view link
        return NextResponse.json({
            success: true,
            webViewLink: uploadRes.data.webViewLink
        }, { status: 200 });

    } catch (error: any) {
        console.error("Failed to upload file to Drive:", error.message);
        if (error.response?.data) {
            console.error("Google APIs Error Data:", JSON.stringify(error.response.data, null, 2));
        }
        return NextResponse.json(
            { error: "Failed to upload file to Drive", details: error.message },
            { status: 500 }
        );
    }
}
