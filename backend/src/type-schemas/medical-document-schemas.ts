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

// Schema for updating medical documentation (body only - id comes from params)
export const updateMedicalDocumentationBodySchema = Type.Object({
    assessment: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    diagnosis: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    treatment: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    prescription: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    status: Type.Optional(Type.Enum(DocumentationStatus)),
    admittedById: Type.Optional(Type.Union([Type.String(), Type.Null()]))
});

export type updateMedicalDocumentationBodyType = Static<typeof updateMedicalDocumentationBodySchema>;

// Params schema for update route
  export const updateMedicalDocumentationParamsSchema = Type.Object({
      id: Type.String()
  });

export type updateMedicalDocumentationParamsType = Static<typeof updateMedicalDocumentationParamsSchema>;

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
    
    // Fields that can be updated (all optional)
    assessment: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    diagnosis: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    treatment: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    prescription: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    status: Type.Optional(Type.Enum(DocumentationStatus)),
    admittedById: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    
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

// Update response (same structure as create)
export const updateMedicalDocumentationResponseSchema = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: medicalDocumentationResponseSchema
});

export type updateMedicalDocumentationResponseType = Static<typeof updateMedicalDocumentationResponseSchema>;

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

/**
 * Schema for GET medical documentation params validation
 * Validates the :id parameter in the URL
 */
export const getMedicalDocumentationParamsSchema = Type.Object({
  id: Type.String({
    description: "The unique identifier of the medical documentation",
    minLength: 1
  })
});

/**
 * Schema for GET medical documentation response
 * Validates the full response with nested bill and billed services
 */
export const getMedicalDocumentationResponseSchema = Type.Object({
  success: Type.Boolean({
    description: "Indicates whether the request was successful"
  }),
  message: Type.String({
    description: "Human-readable message about the operation"
  }),
  data: Type.Optional(
    Type.Object({
      id: Type.String({ description: "Medical documentation ID" }),
      patientId: Type.String({ description: "Associated patient ID" }),
      createdById: Type.String({ description: "Account ID of creator" }),
      admittedById: Type.Union([Type.String(), Type.Null()], {
        description: "Doctor ID who admitted the patient"
      }),
      createdByName: Type.String({ description: "Name of the creator" }),
      createdByRole: Type.Enum(
        { admin: "admin", encoder: "encoder" },
        { description: "Role of the creator" }
      ),
      admittedByName: Type.Union([Type.String(), Type.Null()], {
        description: "Name of admitting doctor"
      }),
      lastUpdatedByName: Type.Union([Type.String(), Type.Null()], {
        description: "Name of last updater"
      }),
      lastUpdatedByRole: Type.Union(
        [
          Type.Enum({ admin: "admin", encoder: "encoder" }),
          Type.Null()
        ],
        { description: "Role of last updater" }
      ),
      assessment: Type.Union([Type.String(), Type.Null()], {
        description: "Patient assessment notes"
      }),
      diagnosis: Type.Union([Type.String(), Type.Null()], {
        description: "Medical diagnosis"
      }),
      treatment: Type.Union([Type.String(), Type.Null()], {
        description: "Treatment plan"
      }),
      prescription: Type.Union([Type.String(), Type.Null()], {
        description: "Medication prescription"
      }),
      status: Type.Enum(
        { complete: "complete", incomplete: "incomplete", draft: "draft" },
        { description: "Documentation status" }
      ),
      createdAt: Type.String({
        format: "date-time",
        description: "Documentation creation timestamp"
      }),
      updatedAt: Type.String({
        format: "date-time",
        description: "Last update timestamp"
      }),
      patient: Type.Object({
        id: Type.String(),
        firstName: Type.String(),
        lastName: Type.String(),
        middleName: Type.Union([Type.String(), Type.Null()])
      }),
      medicalBill: Type.Union(
        [
          Type.Object({
            id: Type.String({ description: "Medical bill ID" }),
            totalAmount: Type.Number({
              description: "Total bill amount"
            }),
            amountPaid: Type.Number({
              description: "Amount already paid"
            }),
            balance: Type.Number({
              description: "Remaining balance"
            }),
            paymentStatus: Type.Enum(
              { paid: "paid", unpaid: "unpaid", partially_paid: "partially_paid" },
              { description: "Current payment status" }
            ),
            billedServices: Type.Array(
              Type.Object({
                id: Type.String({ description: "Billed service ID" }),
                serviceName: Type.String({ description: "Name of the service" }),
                serviceCategory: Type.String({
                  description: "Category of the service"
                }),
                servicePriceAtTime: Type.Number({
                  description: "Price at time of billing"
                }),
                quantity: Type.Integer({
                  description: "Quantity of service billed"
                }),
                subtotal: Type.Number({
                  description: "Line-item total (quantity × price)"
                }),
                createdAt: Type.String({
                  format: "date-time",
                  description: "Billed service creation timestamp"
                })
              }),
              { description: "List of services included in this bill" }
            )
          }),
          Type.Null()
        ],
        { description: "Associated medical bill with billed services or null" }
      )
    })
  )
  
});