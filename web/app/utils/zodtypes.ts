import { z } from 'zod';

export const signupType=z.object({
    
    firstName: z.string()
    .min(3, "*First name must be at least 3 characters*")
    .max(50, "*Last name is too long*"),
    
    lastName: z.string()
    .min(3, "*Last name must be at least 3 characters*")
    .max(50, "*Last name is too long*"),

    email: z.string()
    .email("*Invalid email address*"),

    password: z.string()
    .min(6, "*Password must be at least 6 characters*")
    .max(100, "*Password is too long*")
    .regex(/[A-Z]/, "*Password must contain an uppercase letter*")
    .regex(/[a-z]/, "*Password must contain a lowercase letter*")
    .regex(/[0-9]/, "*Password must contain a number*")
    .regex(/[^A-Za-z0-9]/, "*Password must contain a special character*")
})

export const signinType=z.object({
    email: z.string()
    .email("*Invalid email address*"),
    
    password: z.string()
    .min(6, "*Password must be at least 6 characters*")
    .max(100, "*Password is too long*")
    .regex(/[A-Z]/, "*Password must contain an uppercase letter*")
    .regex(/[a-z]/, "*Password must contain a lowercase letter*")
    .regex(/[0-9]/, "*Password must contain a number*")
    .regex(/[^A-Za-z0-9]/, "*Password must contain a special character*")
}) 
