import { Type, type Static } from "@sinclair/typebox";
import { Role, PaymentStatus, ServiceCategory } from "@prisma/client";

// ==================== REQUEST SCHEMAS ====================

// Schema for service item in bill creation
export const billedServiceItemSchema = Type.Object({
    serviceId: Type.String(),
    quantity: Type.Number({ minimum: 1 })
});

export type billedServiceItemType = Static<typeof billedServiceItemSchema>;

// Schema for creating medical bill with services
export const createMedicalBillSchema = Type.Object({
    medicalDocumentationId: Type.String(),
    services: Type.Array(billedServiceItemSchema, { minItems: 1 }), // At least one service
    notes: Type.Optional(Type.Union([Type.String(), Type.Null()]))
});

export type createMedicalBillType = Static<typeof createMedicalBillSchema>;

// Schema for adding services to existing bill
export const addServicesToBillSchema = Type.Object({
    medicalBillId: Type.String(),
    services: Type.Array(billedServiceItemSchema, { minItems: 1 })
});

export type addServicesToBillType = Static<typeof addServicesToBillSchema>;

// Params schema for getting bill details
export const getMedicalBillParamsSchema = Type.Object({
    id: Type.String()
});

export type getMedicalBillParamsType = Static<typeof getMedicalBillParamsSchema>;

// ==================== SERVICE LAYER SCHEMAS ====================

// Service input for creating medical bill (includes auth fields)
export const createMedicalBillServiceInput = Type.Object({
    medicalDocumentationId: Type.String(),
    services: Type.Array(billedServiceItemSchema, { minItems: 1 }),
    notes: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    
    // From JWT/auth in controller
    createdByName: Type.String(),
    createdByRole: Type.Enum(Role)
});

export type createMedicalBillServiceInputType = Static<typeof createMedicalBillServiceInput>;

// Service input for adding services to bill
export const addServicesToBillServiceInput = Type.Object({
    medicalBillId: Type.String(),
    services: Type.Array(billedServiceItemSchema, { minItems: 1 }),
    
    // From JWT/auth in controller
    updatedByName: Type.String(),
    updatedByRole: Type.Enum(Role)
});

export type addServicesToBillServiceInputType = Static<typeof addServicesToBillServiceInput>;

// ==================== RESPONSE SCHEMAS ====================

// Billed service detail schema
export const billedServiceDetailSchema = Type.Object({
    id: Type.String(),
    serviceName: Type.String(),
    serviceCategory: Type.Enum(ServiceCategory),
    servicePriceAtTime: Type.Number(),
    quantity: Type.Number(),
    subtotal: Type.Number(),
    createdAt: Type.String({ format: 'date-time' })
});

export type billedServiceDetailType = Static<typeof billedServiceDetailSchema>;

// Payment history detail schema
export const paymentHistoryDetailSchema = Type.Object({
    id: Type.String(),
    amountPaid: Type.Number(),
    paymentMethod: Type.Union([Type.String(), Type.Null()]),
    recordedByName: Type.String(),
    recordedByRole: Type.Enum(Role),
    notes: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: 'date-time' })
});

export type paymentHistoryDetailType = Static<typeof paymentHistoryDetailSchema>;

// Basic medical bill response (for create operation)
export const medicalBillBasicResponseSchema = Type.Object({
    id: Type.String(),
    medicalDocumentationId: Type.String(),
    totalAmount: Type.Number(),
    amountPaid: Type.Number(),
    balance: Type.Number(),
    paymentStatus: Type.Enum(PaymentStatus),
    billedServicesCount: Type.Number(),
    createdByName: Type.String(),
    createdByRole: Type.Enum(Role),
    notes: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
});

export type medicalBillBasicResponseType = Static<typeof medicalBillBasicResponseSchema>;

// Detailed medical bill response (with relations)
export const medicalBillDetailedResponseSchema = Type.Object({
    id: Type.String(),
    medicalDocumentationId: Type.String(),
    totalAmount: Type.Number(),
    amountPaid: Type.Number(),
    balance: Type.Number(),
    paymentStatus: Type.Enum(PaymentStatus),
    createdByName: Type.String(),
    createdByRole: Type.Enum(Role),
    lastUpdatedByName: Type.Union([Type.String(), Type.Null()]),
    lastUpdatedByRole: Type.Union([Type.Enum(Role), Type.Null()]),
    notes: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    
    // Related data
    medicalDocumentation: Type.Object({
        id: Type.String(),
        status: Type.String(),
        createdAt: Type.String({ format: 'date-time' }),
        patient: Type.Object({
            id: Type.String(),
            firstName: Type.String(),
            lastName: Type.String(),
            middleName: Type.Union([Type.String(), Type.Null()])
        })
    }),
    billedServices: Type.Array(billedServiceDetailSchema),
    paymentHistory: Type.Array(paymentHistoryDetailSchema),
    paymentResolution: Type.Optional(Type.Union([
        Type.Object({
            id: Type.String(),
            status: Type.String(),
            dueDate: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
            resolutionNotes: Type.Union([Type.String(), Type.Null()])
        }),
        Type.Null()
    ]))
});

export type medicalBillDetailedResponseType = Static<typeof medicalBillDetailedResponseSchema>;

// Wrapped response for create operation
export const createMedicalBillResponseSchema = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: medicalBillBasicResponseSchema
});

export type createMedicalBillResponseType = Static<typeof createMedicalBillResponseSchema>;

// Wrapped response for add services operation
export const addServicesToBillResponseSchema = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: medicalBillBasicResponseSchema
});

export type addServicesToBillResponseType = Static<typeof addServicesToBillResponseSchema>;

// Wrapped response for get bill details
export const getMedicalBillDetailsResponseSchema = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: medicalBillDetailedResponseSchema
});

export type getMedicalBillDetailsResponseType = Static<typeof getMedicalBillDetailsResponseSchema>;

// Error response schema
export const errorResponseSchema = Type.Object({
    statusCode: Type.Number(),
    error: Type.String(),
    message: Type.String()
});

export type errorResponseType = Static<typeof errorResponseSchema>;