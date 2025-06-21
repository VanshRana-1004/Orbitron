import { z } from 'zod';

export const signupType=z.object({
    email: z.string()
    .email("Invalid email address"),
    
    firstName: z.string()
    .min(3, "First name must be at least 3 characters")
    .max(50, "Last name is too long"),
    
    lastName: z.string()
    .min(3, "Last name must be at least 3 characters")
    .max(50, "Last name is too long"),
})

export const signinType=z.object({
    email: z.string()
    .email("Invalid email address"),
    
    password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
}) 

export const passwordType=z.object({
    password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
})