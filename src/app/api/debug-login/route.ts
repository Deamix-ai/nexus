import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        console.log("Testing login for:", email);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { showroom: true }
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: "User not found",
                email
            });
        }

        console.log("User found:", {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            isActive: user.isActive,
            role: user.role
        });

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        return NextResponse.json({
            success: true,
            userExists: !!user,
            isActive: user.isActive,
            passwordValid: isPasswordValid,
            user: {
                id: user.id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                role: user.role,
                showroom: user.showroom?.name
            }
        });

    } catch (error) {
        console.error("Debug login error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}
