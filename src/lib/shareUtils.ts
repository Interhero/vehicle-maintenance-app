import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-for-dev-only-change-in-prod"
);

export async function createShareToken(record: Record<string, any>, expiresIn?: string | number) {
    const jwt = new SignJWT({ record })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt();

    if (expiresIn) {
        if (expiresIn === "never") {
            // No expiration set
        } else {
            jwt.setExpirationTime(expiresIn);
        }
    }

    return await jwt.sign(SECRET);
}

export async function verifyShareToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        const record = payload.record as Record<string, any>;
        if (payload.exp) {
            record.expiresAt = payload.exp * 1000;
        } else {
            record.expiresAt = 'Never';
        }
        return record;
    } catch (error) {
        console.error("JWT Verification failed:", error);
        return null;
    }
}
