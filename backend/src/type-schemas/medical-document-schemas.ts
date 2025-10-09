import { Type, type Static } from "@sinclair/typebox";
import { Role, DocumentationStatus } from "@prisma/client";

// ==================== REQUEST SCHEMAS ====================

// Schema for creating medical documentation (from client/request body)
export const createMedicalDocumentationSchema = Type.Object({
    patientId: Type.String(),
    admittedById: Type.Union([Type.String(), Type.Null()]),
    assessment: Type.Union([Type.String(), Type.Null()]),
    diagnosis: Type.Union([Type.String(), Type.Null()]),
    treatment: Type.Union([Type.String(), Type.Null()]),
    prescription: Type.Union([Type.String(), Type.Null()])
});

export type createMedicalDocumentationType = Static<typeof createMedicalDocumentationSchema>;

// Schema for updating medical documentation
export const updateMedicalDocumentationSchema = Type.Object({
    id: Type.String(), // Document ID to update
    assessment: Type.Union([Type.String(), Type.Null()]),
    diagnosis: Type.Union([Type.String(), Type.Null()]),
    treatment: Type.Union([Type.String(), Type.Null()]),
    prescription: Type.Union([Type.String(), Type.Null()]),
    status: Type.Union([Type.Enum(DocumentationStatus), Type.Null()]), // Allow status changes
    admittedById: Type.Union([Type.String(), Type.Null()]) // Allow changing doctor
});

export type updateMedicalDocumentationType = Static<typeof updateMedicalDocumentationSchema>;

// ==================== SERVICE LAYER SCHEMAS ====================

// Service input for creating (includes auth fields from JWT)
export const medicalDocumentationServiceInput = Type.Object({
    // From request body
    patientId: Type.String(),
    admittedById: Type.Union([Type.String(), Type.Null()]),
    assessment: Type.Union([Type.String(), Type.Null()]),
    diagnosis: Type.Union([Type.String(), Type.Null()]),
    treatment: Type.Union([Type.String(), Type.Null()]),
    prescription: Type.Union([Type.String(), Type.Null()]),
    
    // From JWT/auth in controller
    createdById: Type.String(),
    createdByName: Type.String(),
    createdByRole: Type.Enum(Role)
});

export type medicalDocumentationServiceInputType = Static<typeof medicalDocumentationServiceInput>;

// Service input for updating (includes auth fields for lastUpdatedBy)
export const updateMedicalDocumentationServiceInput = Type.Object({
    // Document to update
    id: Type.String(),
    
    // Fields that can be updated
    assessment: Type.Union([Type.String(), Type.Null()]),
    diagnosis: Type.Union([Type.String(), Type.Null()]),
    treatment: Type.Union([Type.String(), Type.Null()]),
    prescription: Type.Union([Type.String(), Type.Null()]),
    status: Type.Union([Type.Enum(DocumentationStatus), Type.Null()]),
    admittedById: Type.Union([Type.String(), Type.Null()]),
    
    // From JWT/auth in controller (for audit trail)
    lastUpdatedByName: Type.String(),
    lastUpdatedByRole: Type.Enum(Role)
});

export type updateMedicalDocumentationServiceInputType = Static<typeof updateMedicalDocumentationServiceInput>;

// ==================== RESPONSE SCHEMAS ====================

// Single documentation response (what API returns)
export const medicalDocumentationResponseSchema = Type.Object({
    id: Type.String(),
    patientId: Type.String(),
    createdById: Type.String(),
    admittedById: Type.Union([Type.String(), Type.Null()]),
    
    // Denormalized fields
    createdByName: Type.String(),
    createdByRole: Type.Enum(Role),
    admittedByName: Type.Union([Type.String(), Type.Null()]),
    lastUpdatedByName: Type.Union([Type.String(), Type.Null()]),
    lastUpdatedByRole: Type.Union([Type.Enum(Role), Type.Null()]),
    
    // Clinical fields
    assessment: Type.Union([Type.String(), Type.Null()]),
    diagnosis: Type.Union([Type.String(), Type.Null()]),
    treatment: Type.Union([Type.String(), Type.Null()]),
    prescription: Type.Union([Type.String(), Type.Null()]),
    
    status: Type.Enum(DocumentationStatus),
    
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
});

export type medicalDocumentationResponseType = Static<typeof medicalDocumentationResponseSchema>;

// Wrapped response for create/update operations
export const createMedicalDocumentationResponseSchema = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: medicalDocumentationResponseSchema
});

export type createMedicalDocumentationResponseType = Static<typeof createMedicalDocumentationResponseSchema>;

// Response for get all documentations
export const getAllMedicalDocumentationsResponseSchema = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Array(medicalDocumentationResponseSchema)
});

export type getAllMedicalDocumentationsResponseType = Static<typeof getAllMedicalDocumentationsResponseSchema>;

// Response for get single documentation (with relations if needed)
export const getMedicalDocumentationWithRelationsSchema = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Object({
        ...medicalDocumentationResponseSchema.properties,
        patient: Type.Optional(Type.Object({
            id: Type.String(),
            firstName: Type.String(),
            lastName: Type.String(),
            middleName: Type.Union([Type.String(), Type.Null()])
        })),
        medicalBill: Type.Optional(Type.Union([
            Type.Object({
                id: Type.String(),
                totalAmount: Type.Number(),
                amountPaid: Type.Number(),
                balance: Type.Number(),
                paymentStatus: Type.String()
            }),
            Type.Null()
        ]))
    })
});

export type getMedicalDocumentationWithRelationsType = Static<typeof getMedicalDocumentationWithRelationsSchema>;