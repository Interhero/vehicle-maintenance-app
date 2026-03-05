import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-for-dev-only-change-in-prod"
);

export async function createShareToken(record: any, expiresIn?: string | number) {
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
        return payload.record as any;
    } catch (error) {
        console.error("JWT Verification failed:", error);
        return null;
    }
}
