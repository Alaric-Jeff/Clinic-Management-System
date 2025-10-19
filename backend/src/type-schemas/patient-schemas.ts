import { Type, type Static } from "@fastify/type-provider-typebox";
import { Role, Gender, DocumentationStatus } from "@prisma/client";

export const createPatientSchema = Type.Object({
    firstName: Type.String({ minLength: 2, maxLength: 30 }),
    lastName: Type.String({ minLength: 2, maxLength: 30 }),
    middleName: Type.Union([
        Type.String({ minLength: 1, maxLength: 30 }),
        Type.Null()
    ]),
    birthDate: Type.String({ 
        format: 'date-time', 
        description: 'Birth date in ISO 8601 format (e.g., 1990-05-15T00:00:00.000Z)'
    }), 
    gender: Type.Enum(Gender),
    csdIdOrPwdId: Type.Union([Type.String({ minLength: 1 }), Type.Null()]), 
    mobileNumber: Type.Union([Type.String({ minLength: 1, pattern: '^\\+?[\\d\\s\\-()]+$' }), Type.Null()]),   
    residentialAddress: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
    registerDate: Type.Union([Type.String({format: 'date'}), Type.Null()])
});

export const createPatientServiceSchemaType = Type.Object({
    firstName: Type.String({ minLength: 2, maxLength: 30 }),
    lastName: Type.String({ minLength: 2, maxLength: 30 }),
    middleName: Type.Union([
        Type.String({ minLength: 1, maxLength: 30 }),
        Type.Null()
    ]),
    birthDate: Type.String({ format: 'date' }), 
    gender: Type.Enum(Gender),
    csdIdOrPwdId: Type.Union([Type.String(), Type.Null()]), 
    mobileNumber: Type.Union([Type.String(), Type.Null()]),   
    residentialAddress: Type.Union([Type.String(), Type.Null()]),
    registerDate: Type.Union([Type.String({format: 'date'}), Type.Null()]),
    createdByName: Type.String(),
    createdByRole: Type.Enum(Role),
    updatedByName: Type.Union([Type.String(), Type.Null()]),
    updatedByRole:  Type.Union([Type.Enum(Role), Type.Null()])
})

export type createPatientServiceType = Static<typeof createPatientServiceSchemaType>


export const createPatientSuccessResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Object({
      id: Type.String(),
      firstName: Type.String(),
      lastName: Type.String(),
      middleName: Type.String(),
      createdAt: Type.String()
    })
})

export type createPatientType = Static<typeof createPatientSchema>;


export const getTodayPatientSchemaResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Array(Type.Object({
        id: Type.String(),
        firstName: Type.String(),
        lastName: Type.String(),
        middleName: Type.Union([Type.String(), Type.Null()]),
        createdAt: Type.String({ format: 'date-time' })
    }))
});

export const getTotalPatientsCountResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Object({
        count: Type.Number()
    })
});



export const patchPatientSchema = Type.Object({
    id: Type.String(),
    firstName: Type.Union([Type.String({minLength: 2, maxLength: 30}), Type.Null()]),
    lastName: Type.Union([Type.String({minLength: 2, maxLength: 30}), Type.Null()]),
    middleName: Type.Union([Type.String({minLength: 1, maxLength: 30}), Type.Null()]),
    birthDate: Type.Union([Type.String({format: 'date'}), Type.Null()]),
    gender: Type.Union([Type.Enum(Gender), Type.Null()]),
    csdIdOrPwdId: Type.Union([Type.String({minLength: 1}), Type.Null()]),
    mobileNumber: Type.Union([Type.String({minLength: 1, pattern: '^\\+?[\\d\\s\\-()]+$'}), Type.Null()]),
    residentialAddress: Type.Union([Type.String({minLength: 1}), Type.Null()]),    
    // Note: Audit fields (createdByName, createdByRole, updatedByName, updatedByRole) 
    // should NOT be patchable by clients - they're managed by the server
})

export const patchPatientSuccessResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Object({
        id: Type.String(),
        firstName: Type.String(),
        lastName: Type.String(),
        middleName: Type.Union([Type.String(), Type.Null()]),
        birthDate: Type.String({ format: 'date-time' }),
        gender: Type.Enum(Gender),
        csdIdOrPwdId: Type.Union([Type.String(), Type.Null()]),
        mobileNumber: Type.Union([Type.String(), Type.Null()]),
        residentialAddress: Type.Union([Type.String(), Type.Null()]),
        isArchived: Type.Boolean(),
        createdByName: Type.String(),
        updatedByName: Type.String(),
        createdByRole: Type.Enum(Role),
        updatedByRole: Type.Enum(Role),
        createdAt: Type.String({ format: 'date-time' }),
        updatedAt: Type.String({ format: 'date-time' })
    })
});

export type patchPatientType = Static<typeof patchPatientSchema>;


export const patientIdSchema = Type.Object({
    id: Type.String()
});

export type patientIdType = Static<typeof patchPatientSchema>


export const patchPatientServiceSchema = Type.Object({
    id: Type.String(),
    firstName: Type.Union([Type.String({minLength: 2, maxLength: 30}), Type.Null()]),
    lastName: Type.Union([Type.String({minLength: 2, maxLength: 30}), Type.Null()]),
    middleName: Type.Union([Type.String({minLength: 1, maxLength: 30}), Type.Null()]),
    birthDate: Type.Union([Type.String({format: 'date'}), Type.Null()]),
    gender: Type.Union([Type.Enum(Gender), Type.Null()]),
    csdIdOrPwdId: Type.Union([Type.String({minLength: 1}), Type.Null()]),
    mobileNumber: Type.Union([Type.String({minLength: 1, pattern: '^\\+?[\\d\\s\\-()]+$'}), Type.Null()]),
    residentialAddress: Type.Union([Type.String({minLength: 1}), Type.Null()]),    
    updatedByName: Type.String(),
    updatedByRole: Type.Enum(Role)
    // Note: Audit fields (createdByName, createdByRole, updatedByName, updatedByRole) 
    // should NOT be patchable by clients - they're managed by the server
})

export type patchPatientServiceType = Static<typeof patchPatientServiceSchema>;



export const patientWithDocPreviewSchema = Type.Object({
  id: Type.String(),
  firstName: Type.String(),
  lastName: Type.String(),
  middleName: Type.Union([Type.String(), Type.Null()]),
  birthDate: Type.String({ format: 'date-time' }),
  age: Type.Number(), // Calculated field
  gender: Type.Enum(Gender),
  csdIdOrPwdId: Type.Union([Type.String(), Type.Null()]),
  mobileNumber: Type.Union([Type.String(), Type.Null()]),
  residentialAddress: Type.Union([Type.String(), Type.Null()]),
  isArchived: Type.Boolean(),
  
  // Audit fields
  createdByName: Type.String(),
  createdByRole: Type.Enum(Role),
  updatedByName: Type.Union([Type.String(), Type.Null()]),
  updatedByRole: Type.Union([Type.Enum(Role), Type.Null()]),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  
  // Medical documentation preview
  medicalDocumentations: Type.Array(Type.Object({
    id: Type.String(),
    status: Type.Enum(DocumentationStatus),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    createdByName: Type.String(),
    admittedByName: Type.Union([Type.String(), Type.Null()])
  }))
});

export const getOnePatientResponseSchema = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
  data: patientWithDocPreviewSchema
});

export const patientIdParams = Type.Object({
    id: Type.String()
})








